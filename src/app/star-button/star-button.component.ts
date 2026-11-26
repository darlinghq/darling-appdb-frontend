import { Component, ChangeDetectionStrategy, inject, input, linkedSignal, output, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../auth.service';
import { VoteResult, WishlistService } from '../wishlist.service';

@Component({
  selector: 'app-star-button',
  templateUrl: './star-button.component.html',
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
    if (!this.auth.user()) {
      this.router.navigate(['/login'], { queryParams: { returnTo: this.router.url } });
      return;
    }
    if (this.busy()) {
      return;
    }

    const wasVoted = this.voted();
    const wasCount = this.count();
    this.error.set('');
    this.busy.set(true);
    this.voted.set(!wasVoted);
    this.count.set(wasCount + (wasVoted ? -1 : 1));

    const request = wasVoted ? this.wishlist.unvote(this.slug()) : this.wishlist.vote(this.slug());
    request.subscribe({
      next: result => {
        this.busy.set(false);
        this.count.set(result.votes);
        this.voted.set(result.myVote);
        this.changed.emit(result);
      },
      error: () => {
        this.busy.set(false);
        this.count.set(wasCount);
        this.voted.set(wasVoted);
        this.error.set('Could not update your vote. Please try again.');
      }
    });
  }
}
