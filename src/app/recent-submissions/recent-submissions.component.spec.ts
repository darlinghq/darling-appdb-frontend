import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';

import { RecentSubmissionsComponent } from './recent-submissions.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ScreenshotPlaceholderComponent } from '../screenshot-placeholder/screenshot-placeholder.component';
import { MaterialModule } from '../material.module';

describe('RecentSubmissionsComponent', () => {
  let fixture: ComponentFixture<RecentSubmissionsComponent>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, MaterialModule],
      declarations: [RecentSubmissionsComponent, StatusBadgeComponent, ScreenshotPlaceholderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('renders recent submissions from /api/recent', () => {
    fixture = TestBed.createComponent(RecentSubmissionsComponent);
    fixture.detectChanges();

    http.expectOne(r => r.url === '/api/recent').flush(
      [{ name: 'VLC', shortName: 'VLC', lastVersion: '3.0.24', status: 'gold', submittedAt: '2026-11-20T00:00:00Z' }],
      { headers: { 'X-Total-Count': '1' } }
    );
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.card-title')?.textContent).toContain('VLC');
    expect(el.querySelector('app-status-badge')).not.toBeNull();
  });
});
