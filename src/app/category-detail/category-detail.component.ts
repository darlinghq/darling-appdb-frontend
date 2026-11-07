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
  software: SoftwareOverview[] | null = null;
  notFound = false;

  constructor(private route: ActivatedRoute, private categoryService: CategoryService) { }

  ngOnInit() {
    this.categoryId = this.route.snapshot.paramMap.get('id') ?? '';
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
