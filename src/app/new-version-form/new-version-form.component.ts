import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubmissionService, SubmissionResult, ValidationErrors } from '../submission.service';

@Component({
  selector: 'app-new-version-form',
  templateUrl: './new-version-form.component.html',
  styleUrls: ['./new-version-form.component.css'],
  standalone: false
})
export class NewVersionFormComponent {
  softwareName: string;
  form: FormGroup;
  submitting = false;
  result: SubmissionResult | null = null;
  serverErrors: ValidationErrors = {};

  constructor(
    route: ActivatedRoute,
    private fb: FormBuilder,
    private submissionService: SubmissionService,
    private snackBar: MatSnackBar
  ) {
    // Read once, not reactive to later param changes: safe only because no
    // in-app route currently re-enters this component with a different
    // :name without a full navigation/destroy. Revisit if that changes.
    this.softwareName = route.snapshot.paramMap.get('name') ?? '';
    this.form = this.fb.group({
      version: ['', Validators.required],
      download: ['', Validators.required],
    });
  }

  submit() {
    if (this.form.invalid || this.submitting) {
      return;
    }

    this.submitting = true;
    this.serverErrors = {};

    this.submissionService.submitNewVersion(this.softwareName, this.form.value).subscribe({
      next: (result) => {
        this.submitting = false;
        this.result = result;
        this.snackBar.open('Submitted! Opened PR #' + result.prNumber, 'Dismiss', { duration: 5000 });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        if (err.status === 400 && err.error && typeof err.error === 'object') {
          this.serverErrors = err.error;
        } else {
          this.snackBar.open(err.error?.message || 'Submission failed', 'Dismiss', { duration: 5000 });
        }
      }
    });
  }
}
