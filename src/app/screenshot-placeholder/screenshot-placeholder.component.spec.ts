import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenshotPlaceholderComponent } from './screenshot-placeholder.component';

describe('ScreenshotPlaceholderComponent', () => {
  let fixture: ComponentFixture<ScreenshotPlaceholderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [ScreenshotPlaceholderComponent] });
    fixture = TestBed.createComponent(ScreenshotPlaceholderComponent);
    fixture.detectChanges();
  });

  it('shows the decorative logo, hidden from assistive technology', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    const img = el.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('assets/img/darling-logo.svg');
    expect(img.getAttribute('alt')).toBe('');
  });
});
