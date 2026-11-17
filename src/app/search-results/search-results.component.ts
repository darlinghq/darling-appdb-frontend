import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CategoryService, SoftwareOverview, SoftwarePage, REPORT_STATUSES, PAGE_SIZE } from '../category.service';
import { pageFromParam } from '../pagination';

const NO_RESULTS: SoftwarePage = { items: [], total: 0 };

/**
 * Software matching ?q= across all categories. The status filter and page are
 * in the URL too (?status=&page=), so the back button returns to them.
 */
@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class SearchResultsComponent implements OnInit {
  readonly query = signal('');
  readonly results = signal<SoftwareOverview[] | null>(null);
  readonly total = signal(0);

  readonly statuses = REPORT_STATUSES;
  readonly pageSize = PAGE_SIZE;
  readonly statusFilter = signal('');
  /** 1-based. */
  readonly page = signal(1);

  private readonly destroyRef = inject(DestroyRef);

  constructor(private route: ActivatedRoute, private router: Router, private categoryService: CategoryService) { }

  ngOnInit() {
    // switchMap drops the response for a search or page the user has already left.
    this.route.queryParamMap.pipe(
      switchMap(params => {
        this.query.set(params.get('q') ?? '');
        this.statusFilter.set(params.get('status') ?? '');
        this.page.set(pageFromParam(params.get('page')));
        if (!this.query()) {
          return of(NO_RESULTS);
        }
        return this.categoryService.search({ q: this.query(), status: this.statusFilter(), page: this.page() })
          .pipe(catchError(() => of(NO_RESULTS)));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.results.set(result.items);
      this.total.set(result.total);
    });
  }

  onStatusFilterChange(status: string) {
    this.navigate({ status: status || null, page: null });
  }

  onPage(event: PageEvent) {
    this.navigate({ page: event.pageIndex > 0 ? event.pageIndex + 1 : null });
    window.scrollTo({ top: 0 });
  }

  /** Changing the filter goes back to the first page (page: null). */
  private navigate(queryParams: Params) {
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
}
