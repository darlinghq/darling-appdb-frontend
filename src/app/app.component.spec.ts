import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { MaterialModule } from './material.module';

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
});
