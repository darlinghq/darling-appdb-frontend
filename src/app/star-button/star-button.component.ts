import { Component, ChangeDetectionStrategy, inject, input, linkedSignal, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EMPTY } from 'rxjs';
import { finalize, switchMap, take, tap } from 'rxjs/operators';

import { AuthService } from '../auth.service';
import { VoteResult, WishlistService } from '../wishlist.service';
import { serverErrorMessage } from '../http-error-message';

const GENERIC_ERROR = 'Could not update your vote. Please try again.';
/** Statuses whose server message is meant for the user. */
const SHOW_SERVER_MESSAGE = new Set([400, 429, 503]);

@Component({
  selector: 'app-star-button',
  templateUrl: './star-button.component.html',
  styleUrls: ['./star-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class StarButtonComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly wishlist = inject(WishlistService);

  readonly slug = input.required<string>();
  readonly votes = input.required<number>();
  readonly myVote = input<boolean>(false);
  /** Emits the server's answer after a successful vote or unvote. */
  readonly changed = output<VoteResult>();

  // Local copies so the count can change optimistically; they follow the inputs when those change.
  protected readonly count = linkedSignal(() => this.votes());
  protected readonly voted = linkedSignal(() => this.myVote());
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  protected toggle(): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set('');

    let wasVoted = this.voted();
    let wasCount = this.count();
    // Decide logged-in vs logged-out only after the initial /api/user check,
    // so an early click does not bounce a logged-in user to /login.
    this.auth.waitUntilChecked().pipe(
      take(1),
      switchMap(() => {
        if (!this.auth.user()) {
          this.goToLogin();
          return EMPTY;
        }
        wasVoted = this.voted();
        wasCount = this.count();
        this.voted.set(!wasVoted);
        this.count.set(wasCount + (wasVoted ? -1 : 1));
        const request = wasVoted ? this.wishlist.unvote(this.slug()) : this.wishlist.vote(this.slug());
        return request.pipe(take(1));
      }),
      tap(result => {
        this.count.set(result.votes);
        this.voted.set(result.myVote);
      }),
      finalize(() => this.busy.set(false))
    ).subscribe({
      next: result => this.changed.emit(result),
      error: (err: HttpErrorResponse) => {
        this.count.set(wasCount);
        this.voted.set(wasVoted);
        if (err?.status === 401) {
          this.goToLogin();
        } else if (SHOW_SERVER_MESSAGE.has(err?.status)) {
          this.error.set(serverErrorMessage(err, GENERIC_ERROR));
        } else {
          this.error.set(GENERIC_ERROR);
        }
      }
    });
  }

  private goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnTo: this.router.url } });
  }
}
