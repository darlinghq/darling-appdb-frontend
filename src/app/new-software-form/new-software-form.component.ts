import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubmissionService, SubmissionResult, ValidationErrors } from '../submission.service';
import { CategoryService, Category, CPU_ARCHITECTURES } from '../category.service';

@Component({
  selector: 'app-new-software-form',
  templateUrl: './new-software-form.component.html',
  styleUrls: ['./new-software-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class NewSoftwareFormComponent implements OnInit {
  form: FormGroup;
  readonly submitting = signal(false);
  readonly result = signal<SubmissionResult | null>(null);
  readonly serverErrors = signal<ValidationErrors>({});
  readonly categories = signal<Category[] | null>(null);

  readonly cpuArchitectures = CPU_ARCHITECTURES;

  constructor(
    private fb: FormBuilder,
    private submissionService: SubmissionService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      productLink: ['', Validators.required],
      categories: [[] as string[], Validators.required],
      cpu: [['x86-64'] as string[], Validators.required],
      free: [true],
    });
  }

  ngOnInit() {
    this.categoryService.getCategories().subscribe(v => {
      this.categories.set(v);
    });
  }

  submit() {
    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.serverErrors.set({});

    const value = this.form.value;
    this.submissionService.submitNewSoftware({
      name: value.name,
      links: { product: value.productLink },
      cpu: value.cpu,
      free: value.free,
      categories: value.categories,
    }).subscribe({
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
