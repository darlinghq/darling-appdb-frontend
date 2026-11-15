import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { Submitter } from '../software.service';

/** What GitHub allows in a username; anything else is never put in a link. */
const COMMIT_HASH = /^[0-9a-f]{7,40}$/;
const GITHUB_URL_PREFIX = 'https://github.com/';

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
  readonly commit = input<string | undefined>();
  readonly commitUrl = input<string | undefined>();

  /** First 7 characters of the commit hash, or null when absent or malformed. */
  readonly shortCommit = computed(() => {
    const c = this.commit();
    return c && COMMIT_HASH.test(c) ? c.slice(0, 7) : null;
  });

  /** The commit link target; only ever a github.com URL. */
  readonly safeCommitUrl = computed(() => {
    const u = this.commitUrl();
    return u && u.startsWith(GITHUB_URL_PREFIX) ? u : null;
  });

  /** The login to link to, or null when unknown or not a valid GitHub login. */
  readonly linkLogin = computed(() => {
    const login = this.submitter()?.login;
    return login && GITHUB_LOGIN.test(login) ? login : null;
  });
}
