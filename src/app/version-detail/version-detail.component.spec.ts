import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { VersionDetailComponent } from './version-detail.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ReportBylineComponent } from '../report-byline/report-byline.component';
import { MarkdownPipe } from '../markdown/markdown.pipe';
import { MaterialModule } from '../material.module';

describe('VersionDetailComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, MaterialModule],
      declarations: [VersionDetailComponent, StatusBadgeComponent, ReportBylineComponent, MarkdownPipe],
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ name: 'app', version: '2.0' }) } } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  function load(body: object | null): HTMLElement {
    const fixture = TestBed.createComponent(VersionDetailComponent);
    fixture.detectChanges();
    const req = http.expectOne('/api/software/app/versions/2.0');
    if (body) { req.flush(body); } else { req.flush('nope', { status: 404, statusText: 'Not Found' }); }
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const report = (id: string, status: string, extra: object = {}) =>
    ({ id, status, description: `desc-${id}`, ...extra });

  it('shows the newest report expanded and older ones collapsed, each with a byline', () => {
    const el = load({
      version: '2.0', download: 'https://dl.example.com/x.zip', issues: [],
      reports: [
        report('a', 'gold', { submitter: { name: 'Alice', login: 'alice' } }),
        report('b', 'bronze', { submitter: { name: 'Bob' } })
      ]
    });
    const panels = el.querySelectorAll('details.report-entry');
    expect(panels.length).toBe(2);
    expect((panels[0] as HTMLDetailsElement).open).toBe(true);
    expect((panels[1] as HTMLDetailsElement).open).toBe(false);
    expect(panels[0].textContent).toContain('desc-a');
    expect(panels[0].querySelector('a[href="https://github.com/alice"]')).not.toBeNull();
    expect(panels[1].querySelector('summary app-status-badge')).not.toBeNull();
    expect(panels[1].textContent).toContain('Bob');
  });

  it('shows Download only when the version has a download URL', () => {
    let el = load({ version: '2.0', download: 'https://dl.example.com/x.zip', issues: [], reports: [] });
    expect(Array.from(el.querySelectorAll('a')).some(a => a.getAttribute('href') === 'https://dl.example.com/x.zip')).toBe(true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, MaterialModule],
      declarations: [VersionDetailComponent, StatusBadgeComponent, ReportBylineComponent, MarkdownPipe],
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ name: 'app', version: '2.0' }) } } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    el = load({ version: '2.0', download: '', issues: [], reports: [] });
    expect(Array.from(el.querySelectorAll('a')).some(a => a.textContent?.includes('Download'))).toBe(false);
  });

  it('links to reporting on this version', () => {
    const el = load({ version: '2.0', download: '', issues: [], reports: [] });
    const a = Array.from(el.querySelectorAll('a')).find(x => x.textContent?.includes('Report compatibility'))!;
    expect(a.getAttribute('href')).toBe('/software/app/versions/2.0/submit/report');
  });

  it('says so when the version has no reports', () => {
    const el = load({ version: '2.0', download: '', issues: [], reports: [] });
    expect(el.textContent).toContain('No compatibility reports yet for this version.');
  });

  it('shows a not-found message on 404', () => {
    const el = load(null);
    expect(el.textContent).toContain('Version "2.0" of "app" was not found.');
  });
});
