import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { WishlistNewComponent, linkKeyFromLabel } from './wishlist-new.component';
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

  type Row = { label: string; url: string };

  function fill(values: { name?: string; description?: string; links?: Row[] }) {
    const { links, ...rest } = values;
    const c = fixture.componentInstance;
    c.form.patchValue(rest);
    if (links) {
      while (c.links.length < links.length) {
        c.addLink();
      }
      while (c.links.length > links.length) {
        c.removeLink(c.links.length - 1);
      }
      c.links.setValue(links);
    }
    fixture.detectChanges();
  }

  const home: Row = { label: 'Homepage', url: 'https://pear.example.com' };

  function submit() {
    const form = (fixture.nativeElement as HTMLElement).querySelector('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  const el = () => fixture.nativeElement as HTMLElement;

  it('submits the form with slugified link keys and shows the PR link', () => {
    setup(of({ prUrl: 'https://github.com/x/y/pull/7', prNumber: 7 }));
    fill({ name: 'PearCalc', description: 'A calculator', links: [
      { label: ' Home Page! ', url: ' https://pear.example.com ' },
      { label: 'Source code', url: 'http://git.example.com/pear' },
      { label: '', url: '' }
    ] });
    submit();

    expect(propose).toHaveBeenCalledWith({
      name: 'PearCalc',
      description: 'A calculator',
      links: { 'home-page': 'https://pear.example.com', 'source-code': 'http://git.example.com/pear' }
    });
    expect(Object.keys(propose.mock.calls[0][0])).not.toContain('categories');
    const link = el().querySelector('a[href="https://github.com/x/y/pull/7"]');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('rel')).toContain('noopener');
  });

  it('has no categories field and shows the links hint', () => {
    setup(of({}));
    expect(el().textContent).not.toContain('Categories');
    expect(el().textContent).toContain("Add at least one link, for example the product's homepage, so people know which software is meant.");
  });

  it('slugifies labels into keys', () => {
    expect(linkKeyFromLabel('  Source   Code (GitHub) ')).toBe('source-code-github');
    expect(linkKeyFromLabel('A'.repeat(40))).toBe('a'.repeat(32));
    expect(linkKeyFromLabel('x'.repeat(31) + '-yyy')).toBe('x'.repeat(31));
    expect(linkKeyFromLabel('!!!')).toBe('');
  });

  it('can add and remove link rows', () => {
    setup(of({}));
    expect(el().querySelectorAll('.link-row').length).toBe(1);
    (el().querySelector('.add-link') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().querySelectorAll('.link-row').length).toBe(2);
    (el().querySelector('.remove-link') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().querySelectorAll('.link-row').length).toBe(1);
  });

  it('requires at least one complete link row', () => {
    setup(of({ prUrl: 'u', prNumber: 1 }));
    fill({ name: 'PearCalc', links: [{ label: '', url: '' }] });
    submit();
    expect(propose).not.toHaveBeenCalled();
    expect(fixture.componentInstance.links.hasError('noLink')).toBe(true);
    expect(el().textContent).toContain('Add at least one link');
  });

  it('a used row needs both label and an http(s) URL', () => {
    setup(of({ prUrl: 'u', prNumber: 1 }));
    fill({ name: 'PearCalc', links: [{ label: 'Home', url: '' }] });
    submit();
    expect(propose).not.toHaveBeenCalled();
    fill({ links: [{ label: '', url: 'https://x.example' }] });
    submit();
    expect(propose).not.toHaveBeenCalled();
    fill({ links: [{ label: 'Home', url: 'ftp://x.example' }] });
    submit();
    expect(propose).not.toHaveBeenCalled();
    fill({ links: [{ label: '!!!', url: 'https://x.example' }] });
    submit();
    expect(propose).not.toHaveBeenCalled();
    fill({ links: [home, { label: 'Extra', url: '' }] });
    submit();
    expect(propose).not.toHaveBeenCalled();
    fill({ links: [home] });
    expect(fixture.componentInstance.form.valid).toBe(true);
  });

  it('two rows with the same key show an inline error', () => {
    setup(of({ prUrl: 'u', prNumber: 1 }));
    fill({ name: 'PearCalc', links: [home, { label: 'home-page', url: 'https://other.example' }, { label: 'HOMEPAGE', url: 'https://o2.example' }] });
    submit();
    expect(propose).not.toHaveBeenCalled();
    expect(el().textContent).toContain('Two links use the same label');
  });

  it('409 shows the already-exists message', () => {
    setup(throwError(() => new HttpErrorResponse({ status: 409 })));
    fill({ name: 'Pear  Calc++', links: [home] });
    submit();

    expect(el().textContent).toContain('That app is already on the wishlist');
    expect(el().querySelector('a[href="/wishlist/pear-calc"]')).not.toBeNull();
  });

  it('other errors show a generic message', () => {
    setup(throwError(() => new HttpErrorResponse({ status: 500 })));
    fill({ name: 'PearCalc', links: [home] });
    submit();
    expect(el().textContent).toContain('Something went wrong');
  });

  it('a 400 shows the server message', () => {
    setup(throwError(() => new HttpErrorResponse({ status: 400, error: { error: 'invalid link label' } })));
    fill({ name: 'PearCalc', links: [home] });
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
