import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

import { NeedAuthGuard } from './needauth';
import { AuthService } from './auth.service';

describe('NeedAuthGuard', () => {
  function setup(authenticated: boolean) {
    const authServiceStub = {
      waitUntilChecked: () => of(authenticated)
    };
    const routerSpy = { navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        NeedAuthGuard,
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerSpy }
      ]
    });

    return {
      guard: TestBed.inject(NeedAuthGuard),
      router: routerSpy
    };
  }

  it('allows activation once the auth check resolves authenticated, without redirecting', async () => {
    const { guard, router } = setup(true);

    const result = await firstValueFrom(guard.canActivate(null as any, null as any));

    expect(result).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('redirects to /login and blocks activation when the auth check resolves unauthenticated', async () => {
    const { guard, router } = setup(false);

    const result = await firstValueFrom(guard.canActivate(null as any, null as any));

    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
