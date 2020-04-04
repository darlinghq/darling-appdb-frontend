import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../category.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  categories = null;

  constructor(private categoryService: CategoryService) { }

  ngOnInit() {
    this.categoryService.getCategories().subscribe(v => {
      this.categories = v;
    })
  }

}
