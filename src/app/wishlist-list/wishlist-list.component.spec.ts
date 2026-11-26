import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterModule, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
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
  let router: { navigate: ReturnType<typeof vi.fn> };

  const items = [
    { slug: 'foo', name: 'Foo', description: 'Does foo', votes: 3 },
    { slug: 'bar', name: 'Bar', description: 'Does bar', votes: 1 }
  ];

  function setup(params: Record<string, string>, total = 2, rows: object[] = items, response?: Observable<unknown>) {
    queryParamMap = new BehaviorSubject(convertToParamMap(params));
    wishlist = { list: vi.fn().mockReturnValue(response ?? of({ items: rows, total })) };
    TestBed.configureTestingModule({
      imports: [MaterialModule, RouterModule.forRoot([])],
      declarations: [WishlistListComponent, StarButtonComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap } },
        { provide: WishlistService, useValue: wishlist },
        { provide: AuthService, useValue: { user: signal(null), waitUntilChecked: () => of(false) } }
      ]
    });
    router = { navigate: vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true) as unknown as ReturnType<typeof vi.fn> };
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

  it('a failed request shows an error, not the empty message', () => {
    setup({}, 0, [], throwError(() => new HttpErrorResponse({ status: 500 })));
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Could not load the wishlist. Try again.');
    expect(el.textContent).not.toContain('No wishlist entries match.');
    expect(el.querySelectorAll('.wishlist-row').length).toBe(0);
  });

  it('links each row name to its detail page', () => {
    setup({}, 2);
    const el = fixture.nativeElement as HTMLElement;
    const link = el.querySelector('.wishlist-row .row-name a') as HTMLAnchorElement;
    expect(link.textContent).toContain('Foo');
    expect(link.getAttribute('href')).toBe('/wishlist/foo');
  });

  it('has a Propose software button (not a link) that goes to /wishlist/new', async () => {
    setup({}, 2);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('a[href="/wishlist/new"]')).toBeNull();
    const button = el.querySelector('button.propose-btn') as HTMLButtonElement;
    expect(button.textContent).toContain('Propose software');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.hasAttribute('mat-flat-button')).toBe(true);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    button.click();
    expect(navigate).toHaveBeenCalled();
    expect(String(navigate.mock.calls[0][0])).toContain('/wishlist/new');
  });

  it('renders the star pressed for a row the logged-in user voted for', () => {
    setup({}, 2, [{ ...items[0], myVote: true }, { ...items[1], myVote: false }]);
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('app-star-button button');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
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
