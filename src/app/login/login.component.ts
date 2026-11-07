import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LoginComponent {
  readonly loginUrl: string;

  constructor(route: ActivatedRoute) {
    // Forwarded to the backend's /oauth/github/login, which threads it
    // through the OAuth "state" round-trip so the callback can send the user
    // back to the page that sent them here instead of always landing on "/".
    const returnTo = route.snapshot.queryParamMap.get('returnTo');
    this.loginUrl = '/oauth/github/login' + (returnTo ? '?returnTo=' + encodeURIComponent(returnTo) : '');
  }
}
