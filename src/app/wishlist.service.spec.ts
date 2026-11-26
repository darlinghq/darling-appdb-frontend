import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { WishlistService, WishlistItem } from './wishlist.service';

describe('WishlistService', () => {
  let http: HttpTestingController;
  let service: WishlistService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(WishlistService);
  });

  it('list sends q, sort, page and reads X-Total-Count', () => {
    const items: WishlistItem[] = [{ slug: 'a', name: 'A', description: 'd', votes: 3 }];
    let got: { items: WishlistItem[]; total: number } | undefined;
    service.list('foo', 'votes', 2, 20).subscribe(r => got = r);
    const req = http.expectOne(r => r.url === '/api/wishlist');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('foo');
    expect(req.request.params.get('sort')).toBe('votes');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('20');
    req.flush(items, { headers: { 'X-Total-Count': '42' } });
    expect(got).toEqual({ items, total: 42 });
  });

  it('vote posts to /api/wishlist/:slug/vote', () => {
    let got: unknown;
    service.vote('my app').subscribe(r => got = r);
    const req = http.expectOne('/api/wishlist/my%20app/vote');
    expect(req.request.method).toBe('POST');
    req.flush({ votes: 4, myVote: true });
    expect(got).toEqual({ votes: 4, myVote: true });
  });

  it('unvote deletes /api/wishlist/:slug/vote', () => {
    service.unvote('a').subscribe();
    const req = http.expectOne('/api/wishlist/a/vote');
    expect(req.request.method).toBe('DELETE');
    req.flush({ votes: 2, myVote: false });
  });

  it('detail gets the encoded slug', () => {
    service.detail('a/b').subscribe();
    http.expectOne('/api/wishlist/a%2Fb').flush({});
  });

  it('propose posts the body', () => {
    const body = { name: 'N', description: 'D', links: { homepage: 'https://x' } };
    let got: unknown;
    service.propose(body).subscribe(r => got = r);
    const req = http.expectOne('/api/wishlist');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ prUrl: 'u', prNumber: 7 });
    expect(got).toEqual({ prUrl: 'u', prNumber: 7 });
  });
});
