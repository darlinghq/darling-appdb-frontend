import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { RecentService } from './recent.service';
import { PAGE_SIZE } from './category.service';

describe('RecentService', () => {
  let service: RecentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(RecentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests /api/recent with status, q, and pagination params', async () => {
    const resultPromise = firstValueFrom(service.getRecent({ status: 'gold', q: 'vlc', page: 2 }));

    const req = httpMock.expectOne(r => r.url === '/api/recent');
    expect(req.request.params.get('status')).toBe('gold');
    expect(req.request.params.get('q')).toBe('vlc');
    expect(req.request.params.get('from')).toBe(String(PAGE_SIZE));
    expect(req.request.params.get('count')).toBe(String(PAGE_SIZE));
    req.flush([{ name: 'VLC', shortName: 'VLC', status: 'gold' }], {
      headers: { 'X-Total-Count': '30' }
    });

    const page = await resultPromise;
    expect(page.total).toBe(30);
    expect(page.items[0].shortName).toBe('VLC');
  });
});
