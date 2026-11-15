import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { SoftwareDetailComponent } from './software-detail.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ReportBylineComponent } from '../report-byline/report-byline.component';
import { MarkdownPipe } from '../markdown/markdown.pipe';
import { MaterialModule } from '../material.module';

describe('SoftwareDetailComponent links', () => {
  let fixture: ComponentFixture<SoftwareDetailComponent>;
  let http: HttpTestingController;

  function load(software: object) {
    fixture = TestBed.createComponent(SoftwareDetailComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.startsWith('/api/software/')).flush(software);
    http.match('/api/category');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function linkByText(root: HTMLElement, text: string): HTMLAnchorElement | undefined {
    return Array.from(root.querySelectorAll('a')).find(a => a.textContent?.includes(text));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, MaterialModule],
      declarations: [SoftwareDetailComponent, StatusBadgeComponent, ReportBylineComponent, MarkdownPipe],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
  });

  const base = { name: 'app', cpu: [], free: true, categories: [] };
  const version = { version: '1.0', download: 'https://dl.example.com/app.zip', issues: [], lastReport: null };

  it('shows the product link as Website and the version download as Download', () => {
    const el = load({ ...base, links: { product: 'https://product.example.com' }, lastVersion: version });
    expect(linkByText(el, 'Website')?.getAttribute('href')).toBe('https://product.example.com');
    expect(linkByText(el, 'Download')?.getAttribute('href')).toBe('https://dl.example.com/app.zip');
  });

  it('does not repeat the product link in the extra links list', () => {
    const el = load({ ...base, links: { product: 'https://product.example.com', source: 'https://src.example.com' }, lastVersion: version });
    expect(el.querySelectorAll('.software-links li').length).toBe(1);
    expect(linkByText(el, 'source')?.getAttribute('href')).toBe('https://src.example.com');
  });

  it('omits Website when there is no product link and Download when there is no download URL', () => {
    const el = load({ ...base, links: {}, lastVersion: { ...version, download: '' } });
    expect(linkByText(el, 'Website')).toBeUndefined();
    expect(linkByText(el, 'Download')).toBeUndefined();
  });

  it('still shows Website when the software has no versions yet', () => {
    const el = load({ ...base, links: { product: 'https://product.example.com' }, lastVersion: null });
    expect(linkByText(el, 'Website')?.getAttribute('href')).toBe('https://product.example.com');
    expect(linkByText(el, 'Download')).toBeUndefined();
  });

  it('shows the supported CPU architectures', () => {
    const el = load({ ...base, cpu: ['x86-64', 'arm64'], links: {}, lastVersion: version });
    const cpus = Array.from(el.querySelectorAll('.cpu-list li')).map(li => li.textContent?.trim());
    expect(cpus).toEqual(['x86-64', 'arm64']);
  });

  it('omits the CPU list when none are given', () => {
    const el = load({ ...base, cpu: [], links: {}, lastVersion: version });
    expect(el.querySelector('.cpu-list')).toBeNull();
  });
});

describe('SoftwareDetailComponent history', () => {
  let http: HttpTestingController;

  function load(software: object): HTMLElement {
    const fixture = TestBed.createComponent(SoftwareDetailComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.startsWith('/api/software/')).flush(software);
    http.match('/api/category');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, MaterialModule],
      declarations: [SoftwareDetailComponent, StatusBadgeComponent, ReportBylineComponent, MarkdownPipe],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ name: 'app' }) } } }]
    });
    http = TestBed.inject(HttpTestingController);
  });

  const base = { name: 'app', links: {}, cpu: [], free: true, categories: [] };

  it('shows who submitted the current report, linked to GitHub', () => {
    const el = load({
      ...base,
      lastVersion: {
        version: '2.0', download: '', issues: [],
        lastReport: { status: 'gold', description: 'works', submitter: { name: 'Alice', login: 'alice' }, submittedAt: '2026-06-01T00:00:00Z' }
      }
    });
    const a = el.querySelector('.report a[href="https://github.com/alice"]');
    expect(a).not.toBeNull();
  });

  it('lists every version with links to its page', () => {
    const el = load({
      ...base,
      lastVersion: { version: '2.0', download: '', issues: [], lastReport: null },
      versions: [
        { version: '2.0', reportCount: 2, status: 'gold', submittedAt: '2026-06-01T10:00:00Z' },
        { version: '1.0', reportCount: 0 }
      ]
    });
    const rows = el.querySelectorAll('.version-history li');
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('a')!.getAttribute('href')).toBe('/software/app/versions/2.0');
    expect(rows[1].querySelector('a')!.getAttribute('href')).toBe('/software/app/versions/1.0');
    expect(rows[0].querySelector('app-status-badge')).not.toBeNull();
    expect(rows[1].querySelector('app-status-badge')).toBeNull();
    expect(rows[1].textContent).toContain('0 reports');
    expect(rows[0].querySelector('time')?.textContent).toContain('2026');
    expect(rows[1].querySelector('time')).toBeNull();
  });

  it('hides the history with a single version or none', () => {
    let el = load({ ...base, lastVersion: { version: '1.0', download: '', issues: [], lastReport: null }, versions: [{ version: '1.0', reportCount: 0 }] });
    expect(el.querySelector('.version-history')).toBeNull();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, MaterialModule],
      declarations: [SoftwareDetailComponent, StatusBadgeComponent, ReportBylineComponent, MarkdownPipe],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ name: 'app' }) } } }]
    });
    http = TestBed.inject(HttpTestingController);
    el = load({ ...base, lastVersion: null });
    expect(el.querySelector('.version-history')).toBeNull();
  });
});

describe('SoftwareDetailComponent category icons', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, MaterialModule],
      declarations: [SoftwareDetailComponent, StatusBadgeComponent, ReportBylineComponent, MarkdownPipe],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('shows the category icon next to its name, and none for categories without one', () => {
    const fixture = TestBed.createComponent(SoftwareDetailComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.startsWith('/api/software/')).flush({
      name: 'app', links: {}, cpu: [], free: true, categories: ['games', 'misc'], lastVersion: null
    });
    http.expectOne('/api/category').flush({
      games: { name: { en: 'Games' }, icon: '/api/category/games/icon' },
      misc: { name: { en: 'Misc' } }
    });
    fixture.detectChanges();

    const chips = (fixture.nativeElement as HTMLElement).querySelectorAll('mat-chip');
    expect(chips.length).toBe(2);
    const img = chips[0].querySelector('img.category-icon');
    expect(img?.getAttribute('src')).toBe('/api/category/games/icon');
    expect(img?.getAttribute('alt')).toBe('');
    expect(chips[0].textContent).toContain('Games');
    expect(chips[1].querySelector('img')).toBeNull();
  });
});

