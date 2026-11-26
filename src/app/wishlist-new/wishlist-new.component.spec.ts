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

  function fill(values: { name?: string; description?: string; productLink?: string; categories?: string }) {
    fixture.componentInstance.form.patchValue(values);
    fixture.detectChanges();
  }

  function submit() {
    const form = (fixture.nativeElement as HTMLElement).querySelector('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  const el = () => fixture.nativeElement as HTMLElement;

  it('submits the form and shows the PR link', () => {
    setup(of({ prUrl: 'https://github.com/x/y/pull/7', prNumber: 7 }));
    fill({ name: 'PearCalc', description: 'A calculator', productLink: 'https://pear.example.com', categories: ' Utilities, math-tools ,' });
    submit();

    expect(propose).toHaveBeenCalledWith({
      name: 'PearCalc',
      description: 'A calculator',
      links: { product: 'https://pear.example.com' },
      categories: ['utilities', 'math-tools']
    });
    const link = el().querySelector('a[href="https://github.com/x/y/pull/7"]');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('rel')).toContain('noopener');
  });

  it('409 shows the already-exists message', () => {
    setup(throwError(() => new HttpErrorResponse({ status: 409 })));
    fill({ name: 'Pear  Calc++' });
    submit();

    expect(el().textContent).toContain('That app is already on the wishlist');
    expect(el().querySelector('a[href="/wishlist/pear-calc"]')).not.toBeNull();
  });

  it('other errors show a generic message', () => {
    setup(throwError(() => new HttpErrorResponse({ status: 500 })));
    fill({ name: 'PearCalc' });
    submit();
    expect(el().textContent).toContain('Something went wrong');
  });

  it('rejects an invalid category without calling the service', () => {
    setup(of({ prUrl: 'u', prNumber: 1 }));
    fill({ name: 'PearCalc', categories: 'good, -bad' });
    submit();
    expect(propose).not.toHaveBeenCalled();
    expect(el().textContent).toContain('-bad');
  });

  it('requires a name and an http(s) product link', () => {
    setup(of({ prUrl: 'u', prNumber: 1 }));
    fill({ name: '', productLink: 'ftp://x' });
    submit();
    expect(propose).not.toHaveBeenCalled();
    fill({ name: 'A', productLink: 'ftp://x' });
    expect(fixture.componentInstance.form.get('productLink')?.invalid).toBe(true);
    fill({ name: 'A', productLink: 'http://x.example' });
    expect(fixture.componentInstance.form.valid).toBe(true);
  });
});
