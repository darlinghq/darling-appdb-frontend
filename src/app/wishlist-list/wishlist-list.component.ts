import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, Injector, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { WishlistItem, WishlistPage, WishlistService } from '../wishlist.service';
import { AuthService } from '../auth.service';
import { pageFromParam } from '../pagination';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * The most-wanted software list. q, sort and page live in the URL
 * (?q=&sort=&page=&mine=1), so the view is shareable and the back button returns to it.
 */
@Component({
  selector: 'app-wishlist-list',
  templateUrl: './wishlist-list.component.html',
  styleUrls: ['./wishlist-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class WishlistListComponent implements OnInit {
  readonly pageSize = 20;
  readonly query = signal('');
  readonly sort = signal<'votes' | 'name'>('votes');
  /** 1-based. */
  readonly page = signal(1);
  /** ?mine=1 is in the URL; only honoured (sent to the API) while logged in. */
  readonly mineParam = signal(false);
  readonly loggedIn = signal(false);
  readonly items = signal<WishlistItem[] | null>(null);
  readonly total = signal(0);
  /** The last request failed; shown instead of the empty message. */
  readonly failed = signal(false);

  private readonly search$ = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  constructor(private route: ActivatedRoute, private router: Router, private wishlist: WishlistService, private auth: AuthService) { }

  ngOnInit() {
    // switchMap drops the response for a search or page the user has already left.
    // Wait for the initial session check so a ?mine=1 URL is not first
    // requested unfiltered while we still do not know who the user is.
    this.auth.waitUntilChecked().pipe(
      switchMap(() => combineLatest([
        this.route.queryParamMap,
        toObservable(this.auth.user, { injector: this.injector }).pipe(map(u => !!u), distinctUntilChanged())
      ])),
      switchMap(([params, loggedIn]) => {
        this.query.set(params.get('q') ?? '');
        this.sort.set(params.get('sort') === 'name' ? 'name' : 'votes');
        this.page.set(pageFromParam(params.get('page')));
        this.mineParam.set(params.get('mine') === '1');
        this.loggedIn.set(loggedIn);
        this.items.set(null);
        this.failed.set(false);
        const args = [this.query(), this.sort(), this.page(), this.pageSize] as const;
        const request = this.mine() ? this.wishlist.list(...args, true) : this.wishlist.list(...args);
        return request.pipe(catchError((): Observable<WishlistPage | null> => of(null)));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      if (result === null) {
        this.failed.set(true);
        this.items.set([]);
        this.total.set(0);
        return;
      }
      this.items.set(result.items);
      this.total.set(result.total);
    });

    this.search$.pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(q => this.navigate({ q: q.trim() || null, page: null }));
  }

  onSearch(value: string) {
    this.search$.next(value);
  }

  onSortChange(sort: string) {
    this.navigate({ sort: sort === 'name' ? 'name' : null, page: null });
  }

  /** The filter is active: asked for in the URL and the user is logged in. */
  mine(): boolean {
    return this.mineParam() && this.loggedIn();
  }

  onMineChange(checked: boolean) {
    this.navigate({ mine: checked ? '1' : null, page: null });
  }

  onPage(event: PageEvent) {
    this.navigate({ page: event.pageIndex > 0 ? event.pageIndex + 1 : null });
    window.scrollTo({ top: 0 });
  }

  /** Changing the query or sort goes back to the first page (page: null). */
  private navigate(queryParams: Params) {
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
}
