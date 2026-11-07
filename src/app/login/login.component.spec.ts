import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { LoginComponent } from './login.component';
import { MaterialModule } from '../material.module';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  function setup(queryParams: { [key: string]: string }) {
    TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [LoginComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } }
        }
      ]
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    setup({});
    expect(component).toBeTruthy();
  });

  it('links straight to the GitHub login route when there is no returnTo', () => {
    setup({});
    expect(component.loginUrl).toBe('/oauth/github/login');
  });

  it('forwards returnTo as a query param on the GitHub login link', () => {
    setup({ returnTo: '/software/pearcalc/submit/version' });
    expect(component.loginUrl).toBe('/oauth/github/login?returnTo=%2Fsoftware%2Fpearcalc%2Fsubmit%2Fversion');
  });
});
