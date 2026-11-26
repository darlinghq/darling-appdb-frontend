import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ProposeResult, WishlistService } from '../wishlist.service';
import { serverErrorMessage } from '../http-error-message';

const CATEGORY_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const PRODUCT_LINK_PATTERN = /^https?:\/\/\S+$/i;
const GENERIC_ERROR = 'Something went wrong while submitting. Please try again.';

/** Like Validators.required, but whitespace-only counts as empty. */
function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim() === '' ? { required: true } : null;
}

/** Empty is allowed; otherwise the trimmed value must be an http(s) URL. */
function productLinkValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return value === '' || PRODUCT_LINK_PATTERN.test(value) ? null : { pattern: true };
}

/** Splits the comma-separated category text: trimmed, lowercased, empty parts dropped. */
export function parseCategories(text: string): string[] {
  return text.split(',').map(c => c.trim().toLowerCase()).filter(c => c !== '');
}

function categoriesValidator(control: AbstractControl): ValidationErrors | null {
  const bad = parseCategories(control.value ?? '').filter(c => !CATEGORY_PATTERN.test(c));
  return bad.length ? { badCategories: bad } : null;
}

/** Mirrors the backend's slug: lowercase, runs of non-[a-z0-9] become '-', trimmed of '-'. */
export function slugFromName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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
    productLink: new FormControl('', { nonNullable: true, validators: [productLinkValidator] }),
    categories: new FormControl('', { nonNullable: true, validators: [categoriesValidator] })
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
    this.wishlist.propose({
      name,
      description: value.description,
      links: { product: value.productLink.trim() },
      categories: parseCategories(value.categories)
    }).subscribe({
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
