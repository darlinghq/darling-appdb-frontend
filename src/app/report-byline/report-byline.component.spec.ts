import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportBylineComponent } from './report-byline.component';
import { Submitter } from '../software.service';

describe('ReportBylineComponent', () => {
  let fixture: ComponentFixture<ReportBylineComponent>;

  function render(submitter?: Submitter, submittedAt?: string, commit?: string, commitUrl?: string): HTMLElement {
    fixture = TestBed.createComponent(ReportBylineComponent);
    fixture.componentRef.setInput('submitter', submitter);
    fixture.componentRef.setInput('submittedAt', submittedAt);
    fixture.componentRef.setInput('commit', commit);
    fixture.componentRef.setInput('commitUrl', commitUrl);
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

  const SHA = '0123456789abcdef0123456789abcdef01234567';
  const URL = 'https://github.com/darlinghq/darling-appdb-database/commit/' + SHA;

  it('shows a short commit hash linking to the commit, even with nothing else', () => {
    const el = render(undefined, undefined, SHA, URL);
    const a = el.querySelector('a.commit-link')!;
    expect(a.textContent?.trim()).toBe('0123456');
    expect(a.getAttribute('href')).toBe(URL);
    expect(a.getAttribute('rel')).toContain('noopener');
  });

  it('shows the hash as plain text when there is no commit URL', () => {
    const el = render({ name: 'Bob' }, undefined, SHA, undefined);
    expect(el.querySelector('a.commit-link')).toBeNull();
    expect(el.textContent).toContain('0123456');
  });

  it('refuses malformed hashes and non-GitHub commit URLs', () => {
    let el = render({ name: 'Bob' }, undefined, 'not-a-hash!', URL);
    expect(el.textContent).not.toContain('not-a-h');
    expect(el.querySelector('a.commit-link')).toBeNull();
    el = render({ name: 'Bob' }, undefined, SHA, 'javascript:alert(1)');
    expect(el.querySelector('a.commit-link')).toBeNull();
    el = render({ name: 'Bob' }, undefined, SHA, 'https://evil.example.com/x');
    expect(el.querySelector('a.commit-link')).toBeNull();
  });
});
