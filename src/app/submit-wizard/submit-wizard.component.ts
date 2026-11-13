import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubmissionService, SubmissionResult, ValidationErrors } from '../submission.service';
import { CategoryService, Category, CPU_ARCHITECTURES, REPORT_STATUSES } from '../category.service';
import { SoftwareService } from '../software.service';
import { MAX_SCREENSHOTS } from '../screenshot-resize';
import { ScreenshotResizeService } from '../screenshot-resize.service';
import { buildBundlePayload, VersionMode } from '../bundle-payload';

/** Server error keys that describe the submission as a whole, not one field. */
const GENERAL_ERROR_KEYS = ['submission', 'software', 'softwareName', 'version', 'versionId', 'report'];

/**
 * One form for adding software, a version and a compatibility report. Whatever
 * is filled in becomes a single pull request, so contributors do not have to
 * wait for a merge between steps.
 *
 * Reached at /submit (new software) or from a software page (existing
 * software; `version` route param = report on that existing version).
 */
@Component({
  selector: 'app-submit-wizard',
  templateUrl: './submit-wizard.component.html',
  styleUrls: ['./submit-wizard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class SubmitWizardComponent implements OnInit {
  /** Existing software this submission is for; null when adding new software. */
  readonly softwareName: string | null;

  form: FormGroup;
  readonly versionMode = signal<VersionMode>('new');
  readonly reportEnabled = signal(false);
  readonly existingVersionId = signal<string | null>(null);
  readonly lastVersion = signal<string | null>(null);

  readonly submitting = signal(false);
  readonly result = signal<SubmissionResult | null>(null);
  readonly serverErrors = signal<ValidationErrors>({});
  readonly categories = signal<Category[] | null>(null);
  readonly screenshots = signal<string[]>([]);
  readonly screenshotError = signal<string | null>(null);

  readonly cpuArchitectures = CPU_ARCHITECTURES;
  readonly statuses = REPORT_STATUSES;
  readonly maxScreenshots = MAX_SCREENSHOTS;

  constructor(
    route: ActivatedRoute,
    private fb: FormBuilder,
    private submissionService: SubmissionService,
    private categoryService: CategoryService,
    private softwareService: SoftwareService,
    private snackBar: MatSnackBar,
    private screenshotResize: ScreenshotResizeService
  ) {
    // Read once; no in-app navigation re-enters this component with different
    // params without destroying it first.
    const params = route.snapshot.paramMap;
    this.softwareName = params.get('name');
    const presetVersion = params.get('version');

    this.form = this.fb.group({
      software: this.fb.group({
        name: ['', Validators.required],
        productLink: ['', Validators.required],
        categories: [[] as string[], Validators.required],
        cpu: [['x86-64'] as string[], Validators.required],
        free: [true],
      }),
      version: this.fb.group({
        version: ['', Validators.required],
        download: ['', Validators.required],
      }),
      report: this.fb.group({
        status: ['', Validators.required],
        description: ['', Validators.required],
      }),
    });

    if (presetVersion) {
      this.existingVersionId.set(presetVersion);
      this.versionMode.set('existing');
      this.reportEnabled.set(true);
    } else {
      this.versionMode.set((route.snapshot.data?.['versionMode'] as VersionMode | undefined) ?? 'new');
    }
    this.syncGroups();
  }

  ngOnInit() {
    if (!this.softwareName) {
      this.categoryService.getCategories().subscribe(v => this.categories.set(v));
    } else if (!this.existingVersionId()) {
      this.softwareService.getSoftware(this.softwareName).subscribe({
        next: sw => this.lastVersion.set(sw.lastVersion?.version ?? null),
        error: () => { /* the server rejects an unknown software on submit */ },
      });
    }
  }

  /** The existing version this software offers to report on, if any. */
  existingVersionOption(): string | null {
    return this.softwareName ? (this.existingVersionId() ?? this.lastVersion()) : null;
  }

  setVersionMode(mode: VersionMode) {
    this.versionMode.set(mode);
    if (mode === 'existing') {
      this.existingVersionId.set(this.existingVersionOption());
      this.reportEnabled.set(true); // nothing else to submit for an existing version
    } else if (mode === 'none') {
      this.reportEnabled.set(false); // a report needs a version
    }
    this.syncGroups();
  }

  setReportEnabled(on: boolean) {
    const mode = this.versionMode();
    this.reportEnabled.set(mode !== 'none' && (on || mode === 'existing'));
    this.syncGroups();
  }

  /** Disabled groups are ignored by form validity, so only sections in use must be valid. */
  private syncGroups() {
    this.toggle('software', this.softwareName === null);
    this.toggle('version', this.versionMode() === 'new');
    this.toggle('report', this.reportEnabled());
  }

  private toggle(name: string, enabled: boolean) {
    const group = this.form.get(name)!;
    if (enabled) {
      group.enable({ emitEvent: false });
    } else {
      group.disable({ emitEvent: false });
    }
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  canSubmit(): boolean {
    // 'existing' needs a version to refer to. Otherwise something is always
    // submitted: new software, a new version, or the report that an existing
    // version forces.
    const versionOk = this.versionMode() !== 'existing' || !!this.existingVersionId();
    return !this.submitting() && this.form.valid && versionOk;
  }

  generalErrors(): string[] {
    const errors = this.serverErrors();
    return GENERAL_ERROR_KEYS.map(k => errors[k]).filter(m => !!m);
  }

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    this.screenshotError.set(null);

    const remaining = this.maxScreenshots - this.screenshots().length;
    if (files.length > remaining) {
      this.screenshotError.set(`You can attach at most ${this.maxScreenshots} screenshots.`);
    }

    for (const file of files.slice(0, remaining)) {
      try {
        const dataUrl = await this.screenshotResize.resize(file);
        this.screenshots.update(s => [...s, dataUrl]);
      } catch {
        this.screenshotError.set(`Could not process "${file.name}" as an image.`);
      }
    }
  }

  removeScreenshot(index: number) {
    this.screenshots.update(s => s.filter((_, i) => i !== index));
  }

  submit() {
    if (!this.canSubmit()) {
      return;
    }

    this.submitting.set(true);
    this.serverErrors.set({});

    const mode = this.versionMode();
    const payload = buildBundlePayload({
      softwareName: this.softwareName,
      software: this.softwareName === null ? this.form.get('software')!.value : null,
      versionMode: mode,
      existingVersionId: this.existingVersionId(),
      version: mode === 'new' ? this.form.get('version')!.value : null,
      report: this.reportEnabled() ? this.form.get('report')!.value : null,
      screenshots: this.reportEnabled() ? this.screenshots() : [],
    });

    this.submissionService.submitBundle(payload).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.result.set(result);
        this.snackBar.open('Submitted! Opened PR #' + result.prNumber, 'Dismiss', { duration: 5000 });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 400 && err.error && typeof err.error === 'object') {
          this.serverErrors.set(err.error);
        } else {
          this.snackBar.open(err.error?.message || 'Submission failed', 'Dismiss', { duration: 5000 });
        }
      }
    });
  }
}
