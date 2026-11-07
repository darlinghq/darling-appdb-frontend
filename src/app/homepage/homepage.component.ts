import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CategoryService, Category } from '../category.service';

@Component({
    selector: 'app-homepage',
    templateUrl: './homepage.component.html',
    styleUrls: ['./homepage.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class HomepageComponent implements OnInit {
  readonly categories = signal<Category[] | null>(null);

  constructor(private categoryService: CategoryService) { }

  ngOnInit() {
    this.categoryService.getCategories().subscribe(v => {
      this.categories.set(v);
    })
  }

}
