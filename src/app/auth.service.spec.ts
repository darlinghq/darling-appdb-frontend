import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting()
    ]
  }));

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    httpMock = TestBed.inject(HttpTestingController);
    const service: AuthService = TestBed.inject(AuthService);
    expect(service).toBeTruthy();
    httpMock.expectOne('/api/user').flush({ email: 'a@b.com', name: 'A', provider: 'github' });
  });

  it('waitUntilChecked resolves true only after the initial /api/user call succeeds', async () => {
    const service: AuthService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Regression test for the login-redirect race: a route guard reading
    // `authenticated` synchronously (before this resolves) would always see
    // false, even for an already-logged-in user, because the constructor's
    // HTTP call hasn't come back yet.
    expect(service.authenticated).toBe(false);

    const resultPromise = firstValueFrom(service.waitUntilChecked());

    httpMock.expectOne('/api/user').flush({ email: 'a@b.com', name: 'A', provider: 'github' });

    expect(await resultPromise).toBe(true);
    expect(service.authenticated).toBe(true);
  });

  it('waitUntilChecked resolves false when the initial /api/user call fails', async () => {
    const service: AuthService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    const resultPromise = firstValueFrom(service.waitUntilChecked());

    httpMock.expectOne('/api/user').flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(await resultPromise).toBe(false);
  });

  it('keeps the user logged in when a later refresh fails with a non-401 error', async () => {
    vi.useFakeTimers();
    try {
      const service: AuthService = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);
      httpMock.expectOne('/api/user').flush({ email: 'a@b.com', name: 'A', provider: 'github' });
      expect(service.authenticated).toBe(true);

      // Backend restarting during a deploy: nginx answers 502.
      vi.advanceTimersByTime(5 * 60 * 1000);
      httpMock.expectOne('/api/user').flush('bad gateway', { status: 502, statusText: 'Bad Gateway' });
      expect(service.authenticated).toBe(true);

      // A genuine 401 does log the user out.
      vi.advanceTimersByTime(5 * 60 * 1000);
      httpMock.expectOne('/api/user').flush('no', { status: 401, statusText: 'Unauthorized' });
      expect(service.authenticated).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('logout posts to the backend and clears the user', async () => {
    const service: AuthService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/api/user').flush({ email: 'a@b.com', name: 'A', provider: 'github' });

    const done = firstValueFrom(service.logout());
    const req = httpMock.expectOne('/api/logout');
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await done;

    expect(service.authenticated).toBe(false);
  });
});
