import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ProposeResult, WishlistService } from '../wishlist.service';
import { serverErrorMessage } from '../http-error-message';

const LINK_URL_PATTERN = /^https?:\/\/\S+$/i;
const MAX_LINK_KEY = 32;
const GENERIC_ERROR = 'Something went wrong while submitting. Please try again.';

/** Like Validators.required, but whitespace-only counts as empty. */
function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim() === '' ? { required: true } : null;
}

/** Mirrors the backend's slug: lowercase, runs of non-[a-z0-9] become '-', trimmed of '-'. */
export function slugFromName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** A link label as a key: slugified, at most 32 characters (re-trimmed after truncating). */
export function linkKeyFromLabel(label: string): string {
  return slugFromName(label).slice(0, MAX_LINK_KEY).replace(/-+$/, '');
}

type LinkRow = FormGroup<{ label: FormControl<string>; url: FormControl<string> }>;

function isBlankRow(row: AbstractControl): boolean {
  const v = row.value as { label: string; url: string };
  return v.label.trim() === '' && v.url.trim() === '';
}

/** A row that is untouched-empty is ignored; a used row needs a label (with a usable key) and an http(s) URL. */
function linkRowValidator(row: AbstractControl): ValidationErrors | null {
  if (isBlankRow(row)) {
    return null;
  }
  const { label, url } = row.value as { label: string; url: string };
  if (label.trim() === '') {
    return { labelRequired: true };
  }
  if (linkKeyFromLabel(label) === '') {
    return { badLabel: true };
  }
  if (url.trim() === '') {
    return { urlRequired: true };
  }
  return LINK_URL_PATTERN.test(url.trim()) ? null : { badUrl: true };
}

/** At least one used row, and no two rows with the same key. */
function linksValidator(array: AbstractControl): ValidationErrors | null {
  const rows = (array as FormArray).controls.filter(r => !isBlankRow(r));
  if (rows.length === 0) {
    return { noLink: true };
  }
  const seen = new Set<string>();
  for (const row of rows) {
    const key = linkKeyFromLabel((row.value as { label: string }).label);
    if (key === '') {
      continue;
    }
    if (seen.has(key)) {
      return { duplicateKey: key };
    }
    seen.add(key);
  }
  return null;
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

  readonly links = new FormArray<LinkRow>([this.newLinkRow()], { validators: [linksValidator] });

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [trimmedRequired, Validators.maxLength(this.maxName)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(this.maxDescription)] }),
    links: this.links
  });

  readonly submitting = signal(false);
  readonly result = signal<ProposeResult | null>(null);
  /** Set on a 409: the slug of the entry that already exists. */
  readonly existingSlug = signal<string | null>(null);
  readonly duplicate = signal(false);
  readonly error = signal('');

  constructor(private wishlist: WishlistService) { }

  addLink() {
    this.links.push(this.newLinkRow());
  }

  removeLink(index: number) {
    this.links.removeAt(index);
    if (this.links.length === 0) {
      this.addLink();
    }
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) {
      return;
    }
    const value = this.form.getRawValue();
    const name = value.name.trim();
    const links: { [key: string]: string } = {};
    for (const row of value.links) {
      if (row.label.trim() !== '' || row.url.trim() !== '') {
        links[linkKeyFromLabel(row.label)] = row.url.trim();
      }
    }
    this.error.set('');
    this.duplicate.set(false);
    this.submitting.set(true);
    this.wishlist.propose({ name, description: value.description, links }).subscribe({
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

  private newLinkRow(): LinkRow {
    return new FormGroup({
      label: new FormControl('', { nonNullable: true }),
      url: new FormControl('', { nonNullable: true })
    }, { validators: [linkRowValidator] });
  }
}
