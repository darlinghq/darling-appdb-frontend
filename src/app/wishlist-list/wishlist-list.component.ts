import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Observable, Subject, of } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { WishlistItem, WishlistPage, WishlistService } from '../wishlist.service';
import { pageFromParam } from '../pagination';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * The most-wanted software list. q, sort and page live in the URL
 * (?q=&sort=&page=), so the view is shareable and the back button returns to it.
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
  readonly items = signal<WishlistItem[] | null>(null);
  readonly total = signal(0);
  /** The last request failed; shown instead of the empty message. */
  readonly failed = signal(false);

  private readonly search$ = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  constructor(private route: ActivatedRoute, private router: Router, private wishlist: WishlistService) { }

  ngOnInit() {
    // switchMap drops the response for a search or page the user has already left.
    this.route.queryParamMap.pipe(
      switchMap(params => {
        this.query.set(params.get('q') ?? '');
        this.sort.set(params.get('sort') === 'name' ? 'name' : 'votes');
        this.page.set(pageFromParam(params.get('page')));
        this.items.set(null);
        this.failed.set(false);
        return this.wishlist.list(this.query(), this.sort(), this.page(), this.pageSize)
          .pipe(catchError((): Observable<WishlistPage | null> => of(null)));
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

  onPage(event: PageEvent) {
    this.navigate({ page: event.pageIndex > 0 ? event.pageIndex + 1 : null });
    window.scrollTo({ top: 0 });
  }

  /** Changing the query or sort goes back to the first page (page: null). */
  private navigate(queryParams: Params) {
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
}
