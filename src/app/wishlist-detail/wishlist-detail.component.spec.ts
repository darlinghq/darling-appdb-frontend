import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { signal } from '@angular/core';

import { WishlistDetailComponent } from './wishlist-detail.component';
import { StarButtonComponent } from '../star-button/star-button.component';
import { MaterialModule } from '../material.module';
import { AuthService } from '../auth.service';
import { WishlistService } from '../wishlist.service';

describe('WishlistDetailComponent', () => {
  let fixture: ComponentFixture<WishlistDetailComponent>;

  const entry = {
    slug: 'pearcalc',
    name: 'PearCalc',
    description: 'A calculator',
    votes: 4,
    links: { product: 'https://pearcalc.example.com' },
    categories: ['utilities', 'math'],
    myVote: true
  };

  function setup(detail: ReturnType<typeof vi.fn>, slug = 'pearcalc') {
    TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [WishlistDetailComponent, StarButtonComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => slug } } } },
        { provide: Router, useValue: { navigate: vi.fn(), url: '/wishlist/' + slug } },
        { provide: WishlistService, useValue: { detail } },
        { provide: AuthService, useValue: { user: signal(null) } }
      ]
    });
    fixture = TestBed.createComponent(WishlistDetailComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the entry and the history links', () => {
    const detail = vi.fn().mockReturnValue(of(entry));
    const el = setup(detail);

    expect(detail).toHaveBeenCalledWith('pearcalc');
    expect(el.querySelector('h1')?.textContent).toContain('PearCalc');
    expect(el.textContent).toContain('A calculator');
    expect(el.textContent).toContain('utilities');
    expect(el.textContent).toContain('math');
    expect(el.querySelector('app-star-button')).not.toBeNull();
    const hrefs = Array.from(el.querySelectorAll('a')).map(a => a.getAttribute('href'));
    expect(hrefs).toContain('https://pearcalc.example.com');
    expect(hrefs).toContain('https://github.com/darlinghq/darling-appdb-database/blob/master/data/wishlist/p/pe/pearcalc/index.json');
    expect(hrefs).toContain('https://github.com/darlinghq/darling-appdb-database/commits/master/data/wishlist/p/pe/pearcalc/index.json');
  });

  it('uses _ as the second shard for a one-character slug', () => {
    const el = setup(vi.fn().mockReturnValue(of({ ...entry, slug: 'x', links: {} })), 'x');
    const hrefs = Array.from(el.querySelectorAll('a')).map(a => a.getAttribute('href'));
    expect(hrefs).toContain('https://github.com/darlinghq/darling-appdb-database/blob/master/data/wishlist/x/_/x/index.json');
  });

  it('unknown slug shows a not-found message', () => {
    const el = setup(vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 }))), 'nope');
    expect(el.textContent).toContain('not found');
    expect(el.querySelector('app-star-button')).toBeNull();
  });

  it('other errors show a generic message', () => {
    const el = setup(vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 }))));
    expect(el.textContent).toContain('Could not load');
  });
});
