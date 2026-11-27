import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterModule, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { WishlistListComponent } from './wishlist-list.component';
import { StarButtonComponent } from '../star-button/star-button.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { MaterialModule } from '../material.module';
import { AuthService } from '../auth.service';
import { CategoryService } from '../category.service';
import { WishlistService } from '../wishlist.service';
import { WritableSignal, signal } from '@angular/core';

describe('WishlistListComponent', () => {
  let fixture: ComponentFixture<WishlistListComponent>;
  let queryParamMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let wishlist: { list: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const items = [
    { slug: 'foo', name: 'Foo', description: 'Does foo', votes: 3, productLink: 'https://foo.example/app' },
    { slug: 'bar', name: 'Bar', description: 'Does bar', votes: 1 }
  ];

  let user: WritableSignal<{ login: string } | null>;

  function setup(params: Record<string, string>, total = 2, rows: object[] = items, response?: Observable<unknown>, loggedIn = false) {
    user = signal(loggedIn ? { login: 'ann' } : null);
    queryParamMap = new BehaviorSubject(convertToParamMap(params));
    wishlist = { list: vi.fn().mockReturnValue(response ?? of({ items: rows, total })) };
    TestBed.configureTestingModule({
      imports: [MaterialModule, RouterModule.forRoot([])],
      declarations: [WishlistListComponent, StarButtonComponent, StatusBadgeComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap } },
        { provide: WishlistService, useValue: wishlist },
        { provide: CategoryService, useValue: { getCategories: () => of([{ id: 'graphics', name: 'Graphics', link: '/category/graphics' }]) } },
        { provide: AuthService, useValue: { user, waitUntilChecked: () => of(false) } }
      ]
    });
    router = { navigate: vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true) as unknown as ReturnType<typeof vi.fn> };
    fixture = TestBed.createComponent(WishlistListComponent);
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a Product link button as an external anchor, hidden when empty', () => {
    setup({});
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('.wishlist-row');
    const a = rows[0].querySelector('a.row-link') as HTMLAnchorElement;
    expect(a).not.toBeNull();
    expect(a.getAttribute('href')).toBe('https://foo.example/app');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a.textContent).toContain('Product link');
    expect(a.querySelector('mat-icon')?.textContent).toContain('open_in_new');
    expect(rows[1].querySelector('a.row-link')).toBeNull();
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
    expect(el.textContent).not.toContain('requested');
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

  it('has a Propose software button that is a real HTTP link to /wishlist/new', async () => {
    setup({}, 2);
    const el = fixture.nativeElement as HTMLElement;
    const link = el.querySelector('a.propose-btn') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('/wishlist/new');
    expect(link.textContent).toContain('Propose software');
    expect(link.hasAttribute('mat-flat-button')).toBe(true);
    expect(el.querySelector('button.propose-btn')).toBeNull();
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

  describe('Show only my votes', () => {
    const toggle = () => (fixture.nativeElement as HTMLElement).querySelector('mat-slide-toggle') as HTMLElement;
    const toggleInput = () => toggle().querySelector('button[role="switch"], input') as HTMLButtonElement;
    const hint = 'Log in to see the wishlist items you starred.';

    it('is labelled and driven by ?mine=1 when logged in', () => {
      setup({ mine: '1' }, 2, items, undefined, true);
      const el = fixture.nativeElement as HTMLElement;
      expect(toggle().textContent).toContain('Show only my votes');
      expect(toggleInput().getAttribute('aria-checked') ?? String((toggleInput() as unknown as HTMLInputElement).checked)).toBe('true');
      expect(toggleInput().disabled).toBe(false);
      expect(el.textContent).not.toContain(hint);
      expect(wishlist.list).toHaveBeenCalledWith('', 'votes', 1, 20, true);
    });

    it('is off without the param and sends no mine', () => {
      setup({}, 2, items, undefined, true);
      expect(toggleInput().getAttribute('aria-checked')).toBe('false');
      expect(wishlist.list).toHaveBeenCalledWith('', 'votes', 1, 20);
    });

    it('is disabled with a hint when logged out, and mine=1 in the URL is not sent', () => {
      setup({ mine: '1' });
      const el = fixture.nativeElement as HTMLElement;
      expect(toggleInput().disabled).toBe(true);
      expect(el.textContent).toContain(hint);
      expect(wishlist.list).toHaveBeenCalled();
      for (const call of wishlist.list.mock.calls) {
        expect(call[4]).not.toBe(true);
      }
      expect(el.querySelectorAll('.wishlist-row').length).toBe(2);
    });

    it('changing the toggle navigates with mine=1 and resets the page, off removes it', () => {
      setup({ page: '2' }, 50, items, undefined, true);
      fixture.componentInstance.onMineChange(true);
      expect(router.navigate.mock.calls[0][1]).toMatchObject({ queryParams: { mine: '1', page: null }, queryParamsHandling: 'merge' });
      fixture.componentInstance.onMineChange(false);
      expect(router.navigate.mock.calls[1][1]).toMatchObject({ queryParams: { mine: null, page: null } });
    });

    it('shows the not-starred message when filtered and empty', () => {
      setup({ mine: '1' }, 0, [], undefined, true);
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('You have not starred any wishlist items yet.');
      expect(el.textContent).not.toContain('No wishlist entries match.');
    });

    it('keeps the normal empty message when logged out with mine=1', () => {
      setup({ mine: '1' }, 0, []);
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('No wishlist entries match.');
      expect(el.textContent).not.toContain('You have not starred');
    });
  });

  it('supports sort=newest and category filter from the URL', () => {
    setup({ sort: 'newest', category: 'graphics' });
    expect(wishlist.list).toHaveBeenCalledWith('', 'newest', 1, 20, false, 'graphics');
  });

  it('shows View in AppDB when softwareShortName is set, otherwise Submit to AppDB', () => {
    setup({}, 2, [
      { slug: 'foo', name: 'Foo', description: 'Does foo', votes: 3, softwareShortName: 'Foo', softwareStatus: 'gold' },
      { slug: 'bar', name: 'Bar', description: 'Does bar', votes: 1, productLink: 'https://bar.example', categories: ['graphics'] }
    ]);
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('.wishlist-row');
    expect(rows[0].textContent).toContain('View in AppDB');
    expect(rows[0].querySelector('app-status-badge')).not.toBeNull();
    expect(rows[1].textContent).toContain('Submit to AppDB');
  });
});
