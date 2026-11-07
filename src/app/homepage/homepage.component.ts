import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CategoryService, Category } from '../category.service';

@Component({
    selector: 'app-homepage',
    templateUrl: './homepage.component.html',
    styleUrls: ['./homepage.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class HomepageComponent implements OnInit {
  categories: Category[] | null = null;

  constructor(private categoryService: CategoryService) { }

  ngOnInit() {
    this.categoryService.getCategories().subscribe(v => {
      this.categories = v;
    })
  }

}
