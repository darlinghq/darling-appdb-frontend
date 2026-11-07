import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusBadgeComponent, STATUS_BADGES } from './status-badge.component';
import { MaterialModule } from '../material.module';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [StatusBadgeComponent]
    });
    fixture = TestBed.createComponent(StatusBadgeComponent);
  });

  it('renders the label and icon for a known status', () => {
    fixture.componentRef.setInput('status', 'gold');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(STATUS_BADGES['gold'].label);
    expect(compiled.querySelector('mat-icon')?.textContent?.trim()).toBe(STATUS_BADGES['gold'].icon);
  });

  it('renders a distinct badge for every known status', () => {
    for (const status of Object.keys(STATUS_BADGES)) {
      fixture.componentRef.setInput('status', status);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain(STATUS_BADGES[status].label);
    }
  });

  it('falls back to the raw status text for an unrecognized value', () => {
    fixture.componentRef.setInput('status', 'made-up-status');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('made-up-status');
  });
});
