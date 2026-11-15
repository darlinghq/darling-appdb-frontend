import { Component, ChangeDetectionStrategy } from '@angular/core';

export interface StatusLevel {
  status: string;
  summary: string;
  details: string;
}

/**
 * What each report status means, best to worst. Keys must match
 * REPORT_STATUSES / STATUS_BADGES. The meanings follow the AppDB convention
 * used by the report-writing guide (darlinghq/darling-skills,
 * darling-appdb-report); the database itself only defines the names.
 */
export const STATUS_LEVELS: StatusLevel[] = [
  {
    status: 'platinum',
    summary: 'Works perfectly out of the box.',
    details: 'The app installs and runs without any tweaks, and everything that was tested works.'
  },
  {
    status: 'gold',
    summary: 'Works well, with a workaround or a small flaw.',
    details: 'Everything that matters works, but either a workaround is needed (the report explains it), or there is a small flaw that doesn\'t get in the way of using the app, such as an intro video that doesn\'t play.'
  },
  {
    status: 'silver',
    summary: 'Usable, with minor problems.',
    details: 'The app can be used for its main purpose, but secondary features or some of the drawing have minor problems.'
  },
  {
    status: 'bronze',
    summary: 'Starts and partly works.',
    details: 'The app starts and some of it works, but major features fail or it is unstable.'
  },
  {
    status: 'garbage',
    summary: 'Doesn\'t work.',
    details: 'The app doesn\'t install, doesn\'t start, or is unusable.'
  },
];

@Component({
  selector: 'app-status-levels',
  templateUrl: './status-levels.component.html',
  styleUrls: ['./status-levels.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class StatusLevelsComponent {
  readonly levels = STATUS_LEVELS;
}
