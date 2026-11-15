import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { Submitter } from '../software.service';

/** What GitHub allows in a username; anything else is never put in a link. */
export const GITHUB_LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

/** "Reported by @login · date" under a compatibility report. */
@Component({
  selector: 'app-report-byline',
  templateUrl: './report-byline.component.html',
  styleUrls: ['./report-byline.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ReportBylineComponent {
  readonly submitter = input<Submitter | undefined>();
  readonly submittedAt = input<string | undefined>();

  /** The login to link to, or null when unknown or not a valid GitHub login. */
  readonly linkLogin = computed(() => {
    const login = this.submitter()?.login;
    return login && GITHUB_LOGIN.test(login) ? login : null;
  });
}
