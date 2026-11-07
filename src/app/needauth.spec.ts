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
    const routerSpy = { navigate: vi.fn() };

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

    const result = await firstValueFrom(guard.canActivate(null as any, { url: '/submit/software' } as any));

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects to /login with the originally-requested URL as returnTo when unauthenticated', async () => {
    const { guard, router } = setup(false);

    const result = await firstValueFrom(guard.canActivate(null as any, { url: '/submit/software' } as any));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnTo: '/submit/software' } });
  });
});
