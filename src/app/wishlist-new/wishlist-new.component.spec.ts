import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { WishlistNewComponent } from './wishlist-new.component';
import { MaterialModule } from '../material.module';
import { WishlistService } from '../wishlist.service';

describe('WishlistNewComponent', () => {
  let fixture: ComponentFixture<WishlistNewComponent>;
  let propose: ReturnType<typeof vi.fn>;

  function setup(result: unknown) {
    propose = vi.fn().mockReturnValue(result);
    TestBed.configureTestingModule({
      imports: [MaterialModule, ReactiveFormsModule, RouterModule.forRoot([])],
      declarations: [WishlistNewComponent],
      providers: [provideNoopAnimations(), { provide: WishlistService, useValue: { propose } }]
    });
    fixture = TestBed.createComponent(WishlistNewComponent);
    fixture.detectChanges();
  }

  function fill(values: { name?: string; description?: string; productLink?: string }) {
    fixture.componentInstance.form.patchValue(values);
    fixture.detectChanges();
  }

  const link = 'https://pear.example.com';

  function submit() {
    const form = (fixture.nativeElement as HTMLElement).querySelector('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  const el = () => fixture.nativeElement as HTMLElement;

  it('submits name, description and a trimmed productLink and shows the PR link', () => {
    setup(of({ prUrl: 'https://github.com/x/y/pull/7', prNumber: 7 }));
    fill({ name: ' PearCalc ', description: 'A calculator', productLink: ' https://pear.example.com/p ' });
    submit();

    expect(propose).toHaveBeenCalledWith({
      name: 'PearCalc',
      description: 'A calculator',
      productLink: 'https://pear.example.com/p'
    });
    const pr = el().querySelector('a[href="https://github.com/x/y/pull/7"]');
    expect(pr).not.toBeNull();
    expect(pr?.getAttribute('rel')).toContain('noopener');
  });

  it('has a single Product link field and no link rows, add button or hint', () => {
    setup(of({}));
    expect(el().textContent).not.toContain('Categories');
    expect(el().textContent).toContain('Product link');
    expect(el().querySelector('.link-row')).toBeNull();
    expect(el().querySelector('.add-link')).toBeNull();
    expect(el().textContent).not.toContain('Add another link');
    expect(el().textContent).not.toContain('Add at least one link');
  });

  it('requires a product link', () => {
    setup(of({ prUrl: 'u', prNumber: 1 }));
    fill({ name: 'PearCalc', productLink: '   ' });
    submit();
    expect(propose).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.productLink.hasError('required')).toBe(true);
    expect(el().textContent).toContain('Product link is required');
  });

  it('rejects product links that are not http(s) URLs with a host', () => {
    setup(of({ prUrl: 'u', prNumber: 1 }));
    for (const bad of ['ftp://x.example', 'javascript:alert(1)', 'example.com', 'https://', 'http://', 'https://exa mple.com']) {
      fill({ name: 'PearCalc', productLink: bad });
      submit();
      expect(fixture.componentInstance.form.controls.productLink.invalid, bad).toBe(true);
    }
    expect(propose).not.toHaveBeenCalled();
    fill({ productLink: 'http://x.example/a?b=1' });
    expect(fixture.componentInstance.form.valid).toBe(true);
  });

  it('409 shows the already-exists message', () => {
    setup(throwError(() => new HttpErrorResponse({ status: 409 })));
    fill({ name: 'Pear  Calc++', productLink: link });
    submit();

    expect(el().textContent).toContain('That app is already on the wishlist');
    expect(el().querySelector('a[href="/wishlist/pear-calc"]')).not.toBeNull();
  });

  it('other errors show a generic message', () => {
    setup(throwError(() => new HttpErrorResponse({ status: 500 })));
    fill({ name: 'PearCalc', productLink: link });
    submit();
    expect(el().textContent).toContain('Something went wrong');
  });

  it('a 400 shows the server message', () => {
    setup(throwError(() => new HttpErrorResponse({ status: 400, error: { error: 'invalid link label' } })));
    fill({ name: 'PearCalc', productLink: link });
    submit();
    expect(el().querySelector('.form-error')?.textContent).toContain('invalid link label');
  });

  it('a whitespace-only name is invalid', () => {
    setup(of({ prUrl: 'u', prNumber: 1 }));
    fill({ name: '   ' });
    submit();
    expect(propose).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.name.hasError('required')).toBe(true);
    expect(el().textContent).toContain('Name is required');
  });
});
