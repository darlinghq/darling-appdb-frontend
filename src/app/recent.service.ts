import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PAGE_SIZE, SoftwareOverview } from './category.service';
import { Submitter } from './software.service';

export interface RecentSubmission extends SoftwareOverview {
  submittedAt?: string;
  submitter?: Submitter;
}

export interface RecentFilter {
  q?: string;
  status?: string;
  page?: number;
}

export interface RecentPage {
  items: RecentSubmission[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecentService {
  constructor(private httpClient: HttpClient) {}

  /** Paginated list of recent submissions across AppDB, newest first. */
  public getRecent(filter?: RecentFilter): Observable<RecentPage> {
    const page = Math.max(1, filter?.page ?? 1);
    let params = new HttpParams()
      .set('from', (page - 1) * PAGE_SIZE)
      .set('count', PAGE_SIZE);
    if (filter?.status) {
      params = params.set('status', filter.status);
    }
    if (filter?.q) {
      params = params.set('q', filter.q);
    }
    return this.httpClient
      .get<RecentSubmission[]>('/api/recent', { params, observe: 'response' })
      .pipe(map((response: HttpResponse<RecentSubmission[]>) => {
        const items = response.body ?? [];
        const total = Number(response.headers.get('X-Total-Count'));
        return { items, total: Number.isFinite(total) && total >= items.length ? total : items.length };
      }));
  }
}
