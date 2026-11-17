import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CategoryService, SoftwareOverview, REPORT_STATUSES, PAGE_SIZE } from '../category.service';
import { pageFromParam } from '../pagination';

/**
 * One category's software. The search text, status filter and page live in
 * the URL (?q=&status=&page=), so links, reloads and the back button keep them.
 */
@Component({
  selector: 'app-category-detail',
  templateUrl: './category-detail.component.html',
  styleUrls: ['./category-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class CategoryDetailComponent implements OnInit {
  categoryId: string = '';
  readonly categoryName = signal('');
  readonly software = signal<SoftwareOverview[] | null>(null);
  readonly total = signal(0);
  readonly notFound = signal(false);

  readonly statuses = REPORT_STATUSES;
  readonly pageSize = PAGE_SIZE;
  readonly statusFilter = signal('');
  readonly searchQuery = signal('');
  /** 1-based. */
  readonly page = signal(1);

  private readonly destroyRef = inject(DestroyRef);

  constructor(private route: ActivatedRoute, private router: Router, private categoryService: CategoryService) { }

  ngOnInit() {
    this.categoryId = this.route.snapshot.paramMap.get('id') ?? '';
    this.categoryName.set(this.categoryId);

    this.categoryService.getCategoryName(this.categoryId).subscribe({
      next: name => {
        this.categoryName.set(name);
      },
      error: () => {
        // Keep falling back to the id; getCategoryContents below is the
        // authoritative source for whether the category actually exists.
      }
    });

    // switchMap drops the response for a page the user has already left.
    this.route.queryParamMap.pipe(
      switchMap(params => {
        this.searchQuery.set(params.get('q') ?? '');
        this.statusFilter.set(params.get('status') ?? '');
        this.page.set(pageFromParam(params.get('page')));
        return this.categoryService.getCategoryContents(this.categoryId, {
          q: this.searchQuery(),
          status: this.statusFilter(),
          page: this.page()
        }).pipe(catchError(() => {
          this.notFound.set(true);
          return of(null);
        }));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      if (result) {
        this.software.set(result.items);
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

  /** Changing the filters goes back to the first page (page: null). */
  private navigate(queryParams: Params) {
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
}
