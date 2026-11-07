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

  constructor(private route: ActivatedRoute, private categoryService: CategoryService) { }

  ngOnInit() {
    this.categoryId = this.route.snapshot.paramMap.get('id') ?? '';
    this.categoryService.getCategoryContents(this.categoryId).subscribe(v => {
      this.software = v;
    });
  }
}
