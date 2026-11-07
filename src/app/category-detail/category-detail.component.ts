import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoryService, SoftwareOverview, REPORT_STATUSES } from '../category.service';

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
  readonly notFound = signal(false);

  readonly statuses = REPORT_STATUSES;
  readonly statusFilter = signal('');
  readonly searchQuery = signal('');

  constructor(private route: ActivatedRoute, private categoryService: CategoryService) { }

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

    this.reload();
  }

  onStatusFilterChange(status: string) {
    this.statusFilter.set(status);
    this.reload();
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.reload();
  }

  private reload() {
    this.categoryService.getCategoryContents(this.categoryId, {
      status: this.statusFilter(),
      q: this.searchQuery()
    }).subscribe({
      next: v => {
        this.software.set(v);
      },
      error: () => {
        this.notFound.set(true);
      }
    });
  }
}
