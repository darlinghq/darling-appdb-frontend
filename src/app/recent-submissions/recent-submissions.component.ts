import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { PAGE_SIZE, REPORT_STATUSES } from '../category.service';
import { pageFromParam } from '../pagination';
import { RecentService, RecentSubmission } from '../recent.service';

/**
 * Displays the newest AppDB submissions across all categories, newest first.
 */
@Component({
  selector: 'app-recent-submissions',
  templateUrl: './recent-submissions.component.html',
  styleUrls: ['./recent-submissions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class RecentSubmissionsComponent implements OnInit {
  readonly items = signal<RecentSubmission[] | null>(null);
  readonly total = signal(0);
  readonly loadError = signal(false);

  readonly statuses = REPORT_STATUSES;
  readonly pageSize = PAGE_SIZE;
  readonly statusFilter = signal('');
  readonly searchQuery = signal('');
  readonly page = signal(1);

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recentService: RecentService
  ) {}

  ngOnInit() {
    this.route.queryParamMap.pipe(
      switchMap(params => {
        this.searchQuery.set(params.get('q') ?? '');
        this.statusFilter.set(params.get('status') ?? '');
        this.page.set(pageFromParam(params.get('page')));
        this.loadError.set(false);
        return this.recentService.getRecent({
          q: this.searchQuery(),
          status: this.statusFilter(),
          page: this.page()
        }).pipe(catchError(() => {
          this.loadError.set(true);
          return of(null);
        }));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      if (result) {
        this.items.set(result.items);
        this.total.set(result.total);
      }
    });
  }

  onStatusFilterChange(status: string) {
    this.navigate({ status: status || null, page: null });
  }

  onSearch(query: string) {
    this.navigate({ q: query.trim() || null, page: null });
  }

  onPage(event: PageEvent) {
    this.navigate({ page: event.pageIndex > 0 ? event.pageIndex + 1 : null });
    window.scrollTo({ top: 0 });
  }

  private navigate(queryParams: Params) {
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
}
