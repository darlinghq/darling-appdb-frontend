import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';

import { WishlistListComponent } from './wishlist-list.component';
import { StarButtonComponent } from '../star-button/star-button.component';
import { MaterialModule } from '../material.module';
import { AuthService } from '../auth.service';
import { WishlistService } from '../wishlist.service';
import { signal } from '@angular/core';

describe('WishlistListComponent', () => {
  let fixture: ComponentFixture<WishlistListComponent>;
  let queryParamMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let wishlist: { list: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn>; url: string };

  const items = [
    { slug: 'foo', name: 'Foo', description: 'Does foo', votes: 3 },
    { slug: 'bar', name: 'Bar', description: 'Does bar', votes: 1 }
  ];

  function setup(params: Record<string, string>, total = 2, rows = items) {
    queryParamMap = new BehaviorSubject(convertToParamMap(params));
    wishlist = { list: vi.fn().mockReturnValue(of({ items: rows, total })) };
    router = { navigate: vi.fn(), url: '/wishlist' };
    TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [WishlistListComponent, StarButtonComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap } },
        { provide: Router, useValue: router },
        { provide: WishlistService, useValue: wishlist },
        { provide: AuthService, useValue: { user: signal(null) } }
      ]
    });
    fixture = TestBed.createComponent(WishlistListComponent);
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads q, sort and page from the URL', () => {
    setup({ q: 'pear', sort: 'name', page: '3' }, 50);
    expect(wishlist.list).toHaveBeenCalledWith('pear', 'name', 3, 20);
    const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('pear');
  });

  it('defaults to sort=votes, page 1 and an empty query', () => {
    setup({});
    expect(wishlist.list).toHaveBeenCalledWith('', 'votes', 1, 20);
  });

  it('typing in search updates the query param after the debounce', () => {
    vi.useFakeTimers();
    setup({});
    const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;
    input.value = 'ap';
    input.dispatchEvent(new Event('input'));
    input.value = 'app';
    input.dispatchEvent(new Event('input'));

    vi.advanceTimersByTime(299);
    expect(router.navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate.mock.calls[0][1]).toMatchObject({ queryParams: { q: 'app', page: null }, queryParamsHandling: 'merge' });
  });

  it('renders one row per item and shows the total', () => {
    setup({}, 2);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.wishlist-row').length).toBe(2);
    expect(el.textContent).toContain('Foo');
    expect(el.textContent).toContain('Does bar');
    expect(el.querySelectorAll('app-star-button').length).toBe(2);
    expect(el.textContent).toContain('2 requested');
  });

  it('shows an empty message when there are no results', () => {
    setup({ q: 'zzz' }, 0, []);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.wishlist-row').length).toBe(0);
    expect(el.textContent).toContain('No wishlist entries');
  });

  it('changing the sort navigates with the new sort and resets the page', () => {
    setup({ sort: 'votes', page: '2' }, 50);
    fixture.componentInstance.onSortChange('name');
    expect(router.navigate.mock.calls[0][1]).toMatchObject({ queryParams: { sort: 'name', page: null } });
  });

  it('maps the paginator index to a 1-based page param', () => {
    setup({}, 50);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    fixture.componentInstance.onPage({ pageIndex: 2, pageSize: 20, length: 50 });
    expect(router.navigate.mock.calls[0][1]).toMatchObject({ queryParams: { page: 3 } });
  });
});
