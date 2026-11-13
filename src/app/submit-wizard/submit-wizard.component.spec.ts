import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';

import { SubmitWizardComponent } from './submit-wizard.component';
import { MaterialModule } from '../material.module';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { MAX_SCREENSHOTS } from '../screenshot-resize';
import { ScreenshotResizeService } from '../screenshot-resize.service';

const SOFTWARE = { name: 'newapp', productLink: 'https://example.com', categories: ['productivity'], cpu: ['x86-64'], free: true };
const VERSION = { version: '1.1', download: 'https://example.com/1.1.zip' };
const REPORT = { status: 'gold', description: 'works' };

describe('SubmitWizardComponent', () => {
  let http: HttpTestingController;

  function setup(params: Record<string, string> = {}, data: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, ReactiveFormsModule, MaterialModule],
      declarations: [SubmitWizardComponent, StatusBadgeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params), data } } },
        { provide: ScreenshotResizeService, useValue: { resize: vi.fn((f: File) => Promise.resolve(`data:image/jpeg;base64,FAKE-${f.name}`)) } },
      ]
    });
    http = TestBed.inject(HttpTestingController);
    const fixture: ComponentFixture<SubmitWizardComponent> = TestBed.createComponent(SubmitWizardComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  function flushCategories() {
    http.match('/api/category').forEach(r => r.flush({ productivity: { name: { en: 'Productivity' } } }));
  }

  it('new software starts with software and version sections, no report, and cannot submit empty', () => {
    const { component } = setup();
    flushCategories();

    expect(component.softwareName).toBeNull();
    expect(component.versionMode()).toBe('new');
    expect(component.reportEnabled()).toBe(false);
    expect(component.canSubmit()).toBe(false);
  });

  it('submits software + version + report + screenshots as ONE request', async () => {
    const { component } = setup();
    flushCategories();
    component.setReportEnabled(true);
    component.form.patchValue({ software: SOFTWARE, version: VERSION, report: REPORT });
    await component.onFilesSelected({ target: { files: [new File(['x'], 'a.png')], value: '' } } as unknown as Event);

    expect(component.canSubmit()).toBe(true);
    component.submit();

    const req = http.expectOne('/api/submissions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      software: { name: 'newapp', links: { product: 'https://example.com' }, cpu: ['x86-64'], free: true, categories: ['productivity'] },
      version: VERSION,
      report: { ...REPORT, screenshots: ['data:image/jpeg;base64,FAKE-a.png'] },
    });
    req.flush({ prUrl: 'https://github.com/x/y/pull/9', prNumber: 9 });
    http.verify();
    expect(component.result()).toEqual({ prUrl: 'https://github.com/x/y/pull/9', prNumber: 9 });
  });

  it('can submit software alone by choosing no version', () => {
    const { component } = setup();
    flushCategories();
    component.setVersionMode('none');
    component.form.patchValue({ software: SOFTWARE });

    expect(component.canSubmit()).toBe(true);
    component.submit();

    const req = http.expectOne('/api/submissions');
    expect(Object.keys(req.request.body)).toEqual(['software']);
  });

  it('a report is not possible without a version', () => {
    const { component } = setup();
    flushCategories();
    component.setReportEnabled(true);
    component.setVersionMode('none');

    expect(component.reportEnabled()).toBe(false);
  });

  it('opened from a software page: existing software, new version', () => {
    const { component } = setup({ name: 'pearcalc' }, { versionMode: 'new' });
    http.expectOne('/api/software/pearcalc').flush({ name: 'pearcalc', links: {}, cpu: [], free: true, categories: [], lastVersion: { version: '1.0', download: '', issues: [], lastReport: null } });
    component.form.patchValue({ version: VERSION });

    expect(component.softwareName).toBe('pearcalc');
    expect(component.canSubmit()).toBe(true);
    component.submit();

    expect(http.expectOne('/api/submissions').request.body).toEqual({ softwareName: 'pearcalc', version: VERSION });
  });

  it('opened from the report link: existing version, report required', () => {
    const { component } = setup({ name: 'pearcalc', version: '1.0' });

    expect(component.versionMode()).toBe('existing');
    expect(component.reportEnabled()).toBe(true);
    expect(component.canSubmit()).toBe(false);

    component.form.patchValue({ report: REPORT });
    expect(component.canSubmit()).toBe(true);
    component.submit();

    expect(http.expectOne('/api/submissions').request.body).toEqual({
      softwareName: 'pearcalc', versionId: '1.0', report: { ...REPORT, screenshots: [] },
    });
  });

  it('puts the server validation errors, with their section prefixes, into serverErrors', () => {
    const { component } = setup();
    flushCategories();
    component.setVersionMode('none');
    component.form.patchValue({ software: SOFTWARE });
    component.submit();

    http.expectOne('/api/submissions').flush(
      { 'software.name': 'software with this name already exists' },
      { status: 400, statusText: 'Bad Request' });

    expect(component.serverErrors()['software.name']).toContain('already exists');
    expect(component.submitting()).toBe(false);
    expect(component.result()).toBeNull();
  });

  it('cannot submit "existing version" when the software has no version to refer to', () => {
    const { component } = setup({ name: 'pearcalc' }, { versionMode: 'new' });
    http.expectOne('/api/software/pearcalc').flush({ name: 'pearcalc', links: {}, cpu: [], free: true, categories: [], lastVersion: null });

    component.setVersionMode('existing');
    component.form.patchValue({ report: REPORT });

    expect(component.existingVersionOption()).toBeNull();
    expect(component.canSubmit()).toBe(false);
  });

  it('rejects more than the maximum number of screenshots', async () => {
    const { component } = setup({ name: 'pearcalc', version: '1.0' });
    const files = Array.from({ length: MAX_SCREENSHOTS + 1 }, (_, i) => new File(['x'], `s${i}.png`));

    await component.onFilesSelected({ target: { files, value: '' } } as unknown as Event);

    expect(component.screenshots().length).toBe(MAX_SCREENSHOTS);
    expect(component.screenshotError()).toContain(`${MAX_SCREENSHOTS}`);
  });
});
