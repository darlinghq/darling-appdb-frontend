import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoryService, SoftwareOverview, REPORT_STATUSES } from '../category.service';

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

  readonly statuses = REPORT_STATUSES;
  readonly statusFilter = signal('');

  constructor(private route: ActivatedRoute, private categoryService: CategoryService) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.query.set(params.get('q') ?? '');
      this.reload();
    });
  }

  onStatusFilterChange(status: string) {
    this.statusFilter.set(status);
    this.reload();
  }

  private reload() {
    if (!this.query()) {
      this.results.set([]);
      return;
    }

    this.categoryService.search({ q: this.query(), status: this.statusFilter() }).subscribe({
      next: v => this.results.set(v),
      error: () => this.results.set([])
    });
  }
}
