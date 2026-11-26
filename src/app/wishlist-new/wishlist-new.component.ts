import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ProposeResult, WishlistService } from '../wishlist.service';
import { serverErrorMessage } from '../http-error-message';

const GENERIC_ERROR = 'Something went wrong while submitting. Please try again.';

/** Like Validators.required, but whitespace-only counts as empty. */
function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim() === '' ? { required: true } : null;
}

/** Mirrors the backend's slug: lowercase, runs of non-[a-z0-9] become '-', trimmed of '-'. */
export function slugFromName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Trimmed value must be an http(s) URL with a host (mirrors the backend check). */
function productLinkValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (value === '') {
    return null; // reported by trimmedRequired
  }
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== '' ? null : { badUrl: true };
  } catch {
    return { badUrl: true };
  }
}

@Component({
  selector: 'app-wishlist-new',
  templateUrl: './wishlist-new.component.html',
  styleUrls: ['./wishlist-new.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class WishlistNewComponent {
  readonly maxName = 100;
  readonly maxDescription = 5000;

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [trimmedRequired, Validators.maxLength(this.maxName)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(this.maxDescription)] }),
    productLink: new FormControl('', { nonNullable: true, validators: [trimmedRequired, productLinkValidator] })
  });

  readonly submitting = signal(false);
  readonly result = signal<ProposeResult | null>(null);
  /** Set on a 409: the slug of the entry that already exists. */
  readonly existingSlug = signal<string | null>(null);
  readonly duplicate = signal(false);
  readonly error = signal('');

  constructor(private wishlist: WishlistService) { }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) {
      return;
    }
    const value = this.form.getRawValue();
    const name = value.name.trim();
    this.error.set('');
    this.duplicate.set(false);
    this.submitting.set(true);
    this.wishlist.propose({ name, description: value.description, productLink: value.productLink.trim() }).subscribe({
      next: result => {
        this.submitting.set(false);
        this.result.set(result);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err?.status === 409) {
          this.duplicate.set(true);
          this.existingSlug.set(slugFromName(name) || null);
        } else if (err?.status === 400) {
          this.error.set(serverErrorMessage(err, GENERIC_ERROR));
        } else {
          this.error.set(GENERIC_ERROR);
        }
      }
    });
  }
}
