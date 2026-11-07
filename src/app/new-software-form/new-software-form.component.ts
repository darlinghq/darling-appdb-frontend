import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubmissionService, SubmissionResult, ValidationErrors } from '../submission.service';

@Component({
  selector: 'app-new-software-form',
  templateUrl: './new-software-form.component.html',
  styleUrls: ['./new-software-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class NewSoftwareFormComponent {
  form: FormGroup;
  readonly submitting = signal(false);
  readonly result = signal<SubmissionResult | null>(null);
  readonly serverErrors = signal<ValidationErrors>({});

  constructor(private fb: FormBuilder, private submissionService: SubmissionService, private snackBar: MatSnackBar) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      productLink: ['', Validators.required],
      categories: ['', Validators.required],
      cpu: ['x86-64', Validators.required],
      free: [true],
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
      cpu: [value.cpu],
      free: value.free,
      categories: value.categories.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0),
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
