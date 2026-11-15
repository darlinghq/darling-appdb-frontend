import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';

import { SoftwareDetailComponent } from './software-detail.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
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
      declarations: [SoftwareDetailComponent, StatusBadgeComponent, MarkdownPipe],
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
