import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent {
  title = 'darling-appdb';

  constructor(private router: Router, readonly auth: AuthService) { }

  /** Best available label: GitHub users may hide their name and email. */
  displayName(): string {
    const u = this.auth.user();
    return u?.name || u?.email || 'Logged in';
  }

  /** Send the user back to the page they were on after signing in. */
  loginQueryParams(): { returnTo?: string } {
    const url = this.router.url;
    return url && url !== '/' && !url.startsWith('/login') ? { returnTo: url } : {};
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/'));
  }

  search(query: string) {
    const trimmed = query.trim();
    if (trimmed) {
      this.router.navigate(['/search'], { queryParams: { q: trimmed } });
    }
  }
}
