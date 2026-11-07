import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface StatusBadgeInfo {
  label: string;
  icon: string;
  color: string;
}

/** Must match the backend's validReportStatuses enum (validation.go). */
export const STATUS_BADGES: { [status: string]: StatusBadgeInfo } = {
  platinum: { label: 'Platinum', icon: 'military_tech', color: '#8e9aaf' },
  gold: { label: 'Gold', icon: 'military_tech', color: '#c99a2e' },
  silver: { label: 'Silver', icon: 'military_tech', color: '#9a9a9a' },
  bronze: { label: 'Bronze', icon: 'military_tech', color: '#b06a35' },
  garbage: { label: 'Garbage', icon: 'delete', color: '#b00020' },
};

const UNKNOWN_BADGE: StatusBadgeInfo = { label: '', icon: 'help_outline', color: '#777' };

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();

  readonly badge = computed<StatusBadgeInfo>(() => {
    const status = this.status();
    return STATUS_BADGES[status] ?? { ...UNKNOWN_BADGE, label: status };
  });
}
