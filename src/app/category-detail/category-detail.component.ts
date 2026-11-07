import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoryService, SoftwareOverview } from '../category.service';

@Component({
  selector: 'app-category-detail',
  templateUrl: './category-detail.component.html',
  styleUrls: ['./category-detail.component.css'],
  standalone: false
})
export class CategoryDetailComponent implements OnInit {
  categoryId: string = '';
  categoryName: string = '';
  software: SoftwareOverview[] | null = null;
  notFound = false;

  constructor(private route: ActivatedRoute, private categoryService: CategoryService) { }

  ngOnInit() {
    this.categoryId = this.route.snapshot.paramMap.get('id') ?? '';
    this.categoryName = this.categoryId;

    this.categoryService.getCategoryName(this.categoryId).subscribe({
      next: name => {
        this.categoryName = name;
      },
      error: () => {
        // Keep falling back to the id; getCategoryContents below is the
        // authoritative source for whether the category actually exists.
      }
    });

    this.categoryService.getCategoryContents(this.categoryId).subscribe({
      next: v => {
        this.software = v;
      },
      error: () => {
        this.notFound = true;
      }
    });
  }
}
