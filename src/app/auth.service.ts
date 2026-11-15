import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _userInfo = signal<UserInfo | null>(null);

  /** The logged-in user, or null. A signal so templates update when it changes. */
  readonly user = this._userInfo.asReadonly();

  /**
   * Resolves once the initial /api/user check has completed (success or
   * failure) -- NeedAuthGuard waits on this so a route decision is never
   * made before we actually know whether the user is authenticated.
   */
  private readonly initialCheck$: Observable<void>;

  constructor(private httpClient: HttpClient) {
    this.initialCheck$ = this.fetchUserInfo().pipe(
      map(() => undefined),
      shareReplay(1)
    );
    this.initialCheck$.subscribe();

    window.setInterval(() => this.refreshUserInfo(), 5 * 60 * 1000);

    // Timers are throttled in background tabs and stop while a laptop sleeps,
    // so also re-check as soon as the user comes back to the tab.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.refreshUserInfo();
      }
    });
  }

  /**
   * Asks the backend who we are. Only a 401 means "not logged in": any other
   * failure (502 while the backend restarts, a network blip) says nothing
   * about the session, so the last known state is kept instead of showing
   * the user as logged out.
   */
  private fetchUserInfo(): Observable<UserInfo | null> {
    return this.httpClient.get<UserInfo>('/api/user').pipe(
      tap(data => this._userInfo.set(data)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this._userInfo.set(null);
        } else {
          console.error("Cannot refresh auth'd user info, keeping current state", error);
        }
        return of(null);
      })
    );
  }

  private refreshUserInfo() {
    this.fetchUserInfo().subscribe();
  }

  /** Ends the session on the backend and forgets the user locally. */
  public logout(): Observable<void> {
    return this.httpClient.post<void>('/api/logout', null).pipe(
      catchError(() => of(undefined)),
      tap(() => this._userInfo.set(null)),
      map(() => undefined)
    );
  }

  /** Completes once the initial auth check has resolved; use before trusting `authenticated`. */
  public waitUntilChecked(): Observable<boolean> {
    return this.initialCheck$.pipe(map(() => this.authenticated));
  }

  get userInfo(): UserInfo | null {
    return this._userInfo();
  }

  get authenticated(): boolean {
    return !!this._userInfo();
  }
}

export class UserInfo {
  email!: string;
  name!: string;
  provider!: string;
}
