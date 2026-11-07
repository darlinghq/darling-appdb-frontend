import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent {
  title = 'darling-appdb';

  constructor(private router: Router) { }

  search(query: string) {
    const trimmed = query.trim();
    if (trimmed) {
      this.router.navigate(['/search'], { queryParams: { q: trimmed } });
    }
  }
}
