import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { StatusLevelsComponent, STATUS_LEVELS } from './status-levels.component';
import { StatusBadgeComponent, STATUS_BADGES } from '../status-badge/status-badge.component';
import { REPORT_STATUSES } from '../category.service';
import { MaterialModule } from '../material.module';

describe('StatusLevelsComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RouterTestingModule, MaterialModule],
    declarations: [StatusLevelsComponent, StatusBadgeComponent]
  }));

  it('explains every status the backend accepts, best to worst', () => {
    expect(STATUS_LEVELS.map(l => l.status)).toEqual(REPORT_STATUSES);
    for (const s of REPORT_STATUSES) {
      expect(STATUS_BADGES[s]).toBeTruthy();
    }
  });

  it('renders one anchor-able row per status', () => {
    const fixture = TestBed.createComponent(StatusLevelsComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    for (const s of REPORT_STATUSES) {
      expect(el.querySelector('#' + s)).toBeTruthy();
    }
  });
});
