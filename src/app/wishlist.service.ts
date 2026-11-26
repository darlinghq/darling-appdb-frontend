import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  constructor(private httpClient: HttpClient) { }

  /** One page of the wishlist; `total` is the unpaginated count from X-Total-Count. */
  public list(q: string, sort: string, page: number, limit: number): Observable<WishlistPage> {
    const params = new HttpParams()
      .set('q', q)
      .set('sort', sort)
      .set('page', String(page))
      .set('limit', String(limit));
    return this.httpClient.get<WishlistItem[]>('/api/wishlist', { params, observe: 'response' }).pipe(
      map(response => ({
        items: response.body ?? [],
        total: Number(response.headers.get('X-Total-Count') ?? 0)
      }))
    );
  }

  public detail(slug: string): Observable<WishlistDetail> {
    return this.httpClient.get<WishlistDetail>(this.url(slug));
  }

  public vote(slug: string): Observable<VoteResult> {
    return this.httpClient.post<VoteResult>(this.url(slug) + '/vote', null);
  }

  public unvote(slug: string): Observable<VoteResult> {
    return this.httpClient.delete<VoteResult>(this.url(slug) + '/vote');
  }

  /** Proposes new software; the backend opens a pull request for it. */
  public propose(body: WishlistProposal): Observable<ProposeResult> {
    return this.httpClient.post<ProposeResult>('/api/wishlist', body);
  }

  private url(slug: string): string {
    return `/api/wishlist/${encodeURIComponent(slug)}`;
  }
}

export interface WishlistItem {
  slug: string;
  name: string;
  description: string;
  votes: number;
  /** Only present when the viewer is logged in. */
  myVote?: boolean;
}

export interface WishlistDetail extends WishlistItem {
  /** Labelled links (key = slugified label), present on the detail response only. */
  links: { [key: string]: string };
  /** Only present when the viewer is logged in. */
  myVote?: boolean;
}

export interface WishlistPage {
  items: WishlistItem[];
  total: number;
}

export interface VoteResult {
  votes: number;
  myVote: boolean;
}

export interface WishlistProposal {
  name: string;
  description: string;
  /** Keys are slugified labels (^[a-z0-9][a-z0-9-]{0,31}$), values http(s) URLs. */
  links: { [key: string]: string };
}

export interface ProposeResult {
  prUrl: string;
  prNumber: number;
}
