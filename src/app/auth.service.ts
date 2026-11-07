import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _userInfo: UserInfo | null = null;

  /**
   * Resolves once the initial /api/user check has completed (success or
   * failure) -- NeedAuthGuard waits on this so a route decision is never
   * made before we actually know whether the user is authenticated.
   */
  private readonly initialCheck$: Observable<void>;

  constructor(private httpClient: HttpClient) {
    this.initialCheck$ = this.httpClient.get<UserInfo>('/api/user').pipe(
      tap(data => this._userInfo = data),
      catchError(() => {
        this._userInfo = null;
        return of(null);
      }),
      map(() => undefined),
      shareReplay(1)
    );
    this.initialCheck$.subscribe();

    window.setInterval(() => {
      this.refreshUserInfo();
    }, 5 * 60 * 1000);
  }

  private refreshUserInfo() {
    this.httpClient.get<UserInfo>('/api/user').subscribe({
      next: data => this._userInfo = data,
      error: error => {
        console.error("Cannot get auth'd user info", error);
        this._userInfo = null;
      }
    });
  }

  /** Completes once the initial auth check has resolved; use before trusting `authenticated`. */
  public waitUntilChecked(): Observable<boolean> {
    return this.initialCheck$.pipe(map(() => this.authenticated));
  }

  get userInfo(): UserInfo | null {
    return this._userInfo;
  }

  get authenticated(): boolean {
    return !!this._userInfo;
  }
}

export class UserInfo {
  email!: string;
  name!: string;
  provider!: string;
}
