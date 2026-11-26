import { Component, OnInit, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { VoteResult, WishlistDetail, WishlistService } from '../wishlist.service';

const DATABASE_URL = 'https://github.com/darlinghq/darling-appdb-database';
const WISHLIST_PATH = 'data/wishlist';

/** Where an entry lives in the database repo: data/wishlist/<s1>/<s2>/<slug>/index.json. */
export function wishlistIndexPath(slug: string): string {
  const second = slug.length > 1 ? slug.slice(0, 2) : '_';
  return `${WISHLIST_PATH}/${slug.slice(0, 1)}/${second}/${slug}/index.json`;
}

@Component({
  selector: 'app-wishlist-detail',
  templateUrl: './wishlist-detail.component.html',
  styleUrls: ['./wishlist-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class WishlistDetailComponent implements OnInit {
  slug = '';
  readonly entry = signal<WishlistDetail | null>(null);
  readonly notFound = signal(false);
  readonly failed = signal(false);

  /** Links to the entry's index.json and its history on GitHub (slugs are validated server side; only a-z0-9- reach here). */
  readonly sourceUrl = computed(() => this.githubUrl('blob'));
  readonly historyUrl = computed(() => this.githubUrl('commits'));

  constructor(private route: ActivatedRoute, private wishlist: WishlistService) { }

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.wishlist.detail(this.slug).subscribe({
      next: entry => this.entry.set(entry),
      error: (err: HttpErrorResponse) => {
        if (err?.status === 404) {
          this.notFound.set(true);
        } else {
          this.failed.set(true);
        }
      }
    });
  }

  links(entry: WishlistDetail): { key: string; url: string }[] {
    return Object.entries(entry.links ?? {})
      .filter(([, url]) => !!url)
      .map(([key, url]) => ({ key, url }));
  }

  onVote(result: VoteResult) {
    const entry = this.entry();
    if (entry) {
      this.entry.set({ ...entry, votes: result.votes, myVote: result.myVote });
    }
  }

  private githubUrl(kind: 'blob' | 'commits'): string {
    const slug = this.entry()?.slug;
    return slug ? `${DATABASE_URL}/${kind}/master/${wishlistIndexPath(slug)}` : '';
  }
}
