import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { MaterialModule } from './material.module';
import { NavigationEnd, Router } from '@angular/router';
import { filter, firstValueFrom, of } from 'rxjs';
import { AppRoutingModule } from './app-routing.module';
import { NeedAuthGuard } from './needauth';
import { AuthService } from './auth.service';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MaterialModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'darling-appdb'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('darling-appdb');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('span.title').textContent).toContain('Darling AppDB');
  });

  describe('displayName', () => {
    function nameFor(user: object | null): string {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      vi.spyOn(app.auth, 'user').mockReturnValue(user as never);
      return app.displayName();
    }

    it('prefers name, then GitHub login, then email', () => {
      expect(nameFor({ name: 'Ann', login: 'ann', email: 'a@b.c' })).toBe('Ann');
      expect(nameFor({ name: '', login: 'ann', email: 'a@b.c' })).toBe('ann');
      expect(nameFor({ name: '', login: '', email: 'a@b.c' })).toBe('a@b.c');
    });

    it('falls back to a generic label', () => {
      expect(nameFor({ name: '', login: '', email: '' })).toBe('Logged in');
    });
  });

  it('has a Wishlist nav link to /wishlist in the wide nav', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const wide = fixture.nativeElement.querySelector('nav.wide-nav a[href="/wishlist"]');
    expect(wide).toBeTruthy();
    expect(wide.textContent).toContain('Wishlist');
  });
});

describe('wishlist routes', () => {
  let router: Router;

  beforeEach(async () => {
    const authStub = { waitUntilChecked: () => of(false), user: () => null };
    await TestBed.configureTestingModule({
      imports: [AppRoutingModule],
      providers: [NeedAuthGuard, { provide: AuthService, useValue: authStub }],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  it('navigating to /wishlist/new while logged out redirects to /login', async () => {
    const settled = firstValueFrom(router.events.pipe(filter(e => e instanceof NavigationEnd)));
    await router.navigateByUrl('/wishlist/new');
    await settled;
    expect(router.url).toBe('/login?returnTo=%2Fwishlist%2Fnew');
  });

  it('declares wishlist/new, guarded, before wishlist/:slug', () => {
    const paths = router.config.map(r => r.path);
    const idxNew = paths.indexOf('wishlist/new');
    expect(paths).toContain('wishlist');
    expect(idxNew).toBeGreaterThan(-1);
    expect(idxNew).toBeLessThan(paths.indexOf('wishlist/:slug'));
    expect(router.config[idxNew].canActivate).toEqual([NeedAuthGuard]);
  });
});
