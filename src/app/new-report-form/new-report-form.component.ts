import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubmissionService, SubmissionResult, ValidationErrors } from '../submission.service';
import { REPORT_STATUSES } from '../category.service';
import { MAX_SCREENSHOTS } from '../screenshot-resize';
import { ScreenshotResizeService } from '../screenshot-resize.service';

@Component({
  selector: 'app-new-report-form',
  templateUrl: './new-report-form.component.html',
  styleUrls: ['./new-report-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class NewReportFormComponent {
  softwareName: string;
  versionId: string;
  form: FormGroup;
  readonly submitting = signal(false);
  readonly result = signal<SubmissionResult | null>(null);
  readonly serverErrors = signal<ValidationErrors>({});
  readonly screenshots = signal<string[]>([]);
  readonly screenshotError = signal<string | null>(null);

  statuses = REPORT_STATUSES;
  readonly maxScreenshots = MAX_SCREENSHOTS;

  constructor(
    route: ActivatedRoute,
    private fb: FormBuilder,
    private submissionService: SubmissionService,
    private snackBar: MatSnackBar,
    private screenshotResize: ScreenshotResizeService
  ) {
    // Read once, not reactive to later param changes: safe only because no
    // in-app route currently re-enters this component with a different
    // :name/:version without a full navigation/destroy. Revisit if that changes.
    this.softwareName = route.snapshot.paramMap.get('name') ?? '';
    this.versionId = route.snapshot.paramMap.get('version') ?? '';
    this.form = this.fb.group({
      status: ['', Validators.required],
      description: ['', Validators.required],
    });
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
    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.serverErrors.set({});

    const payload = { ...this.form.value, screenshots: this.screenshots() };

    this.submissionService.submitNewReport(this.softwareName, this.versionId, payload).subscribe({
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
