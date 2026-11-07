import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoryService, SoftwareOverview } from '../category.service';

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

    this.categoryService.getCategoryContents(this.categoryId).subscribe({
      next: v => {
        this.software.set(v);
      },
      error: () => {
        this.notFound.set(true);
      }
    });
  }
}
