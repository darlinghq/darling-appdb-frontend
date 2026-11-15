import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportBylineComponent } from './report-byline.component';
import { Submitter } from '../software.service';

describe('ReportBylineComponent', () => {
  let fixture: ComponentFixture<ReportBylineComponent>;

  function render(submitter?: Submitter, submittedAt?: string): HTMLElement {
    fixture = TestBed.createComponent(ReportBylineComponent);
    fixture.componentRef.setInput('submitter', submitter);
    fixture.componentRef.setInput('submittedAt', submittedAt);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [ReportBylineComponent] });
  });

  it('links a known login to its GitHub profile', () => {
    const el = render({ name: 'Octo', login: 'octocat' });
    const a = el.querySelector('a')!;
    expect(a.getAttribute('href')).toBe('https://github.com/octocat');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
    expect(a.textContent).toContain('@octocat');
  });

  it('shows the name unlinked when there is no login', () => {
    const el = render({ name: 'Bob' });
    expect(el.querySelector('a')).toBeNull();
    expect(el.textContent).toContain('Bob');
  });

  it('never links a login that is not a valid GitHub login', () => {
    for (const login of ['../evil', 'a b', '-lead', 'x'.repeat(40)]) {
      const el = render({ name: 'Mallory', login });
      expect(el.querySelector('a')).toBeNull();
      expect(el.textContent).toContain('Mallory');
    }
  });

  it('shows the submission date', () => {
    const el = render({ name: 'Bob' }, '2026-06-01T10:00:00Z');
    expect(el.textContent).toContain('2026');
  });

  it('renders nothing without a submitter or a date', () => {
    expect(render().textContent?.trim()).toBe('');
  });
});
