import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

/** Raw shape of one entry in the backend's GET /api/category map response. */
interface RawCategory {
  name: { [locale: string]: string };
  icon?: string;
}

/** Picks a display name out of a backend locale map, preferring English. */
function pickLocalizedName(name: { [locale: string]: string } | undefined | null): string {
  if (!name) {
    return '';
  }
  if (name['en']) {
    return name['en'];
  }
  const values = Object.values(name);
  return values.length > 0 ? values[0] : '';
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private httpClient: HttpClient) { }

  public getCategories(): Observable<Category[]> {
    return this.httpClient.get<{ [id: string]: RawCategory }>('/api/category').pipe(map(o => {
      const rv: Category[] = [];

      for (const [key, value] of Object.entries(o)) {
        rv.push({
          id: key,
          name: pickLocalizedName(value.name),
          link: '/category/' + key,
          icon: value.icon
        });
      }

      rv.sort((a, b) => a.name.localeCompare(b.name));

      return rv;
    }));
  }

  /** Looks up one category's display name by its id (the route/short-name key). */
  public getCategoryName(id: string): Observable<string> {
    return this.httpClient.get<{ [id: string]: RawCategory }>('/api/category').pipe(map(o => {
      const entry = o[id];
      return entry ? pickLocalizedName(entry.name) : id;
    }));
  }

  /** One page (see SoftwareFilter.page) of a category's software. */
  public getCategoryContents(id: string, filter?: SoftwareFilter): Observable<SoftwarePage> {
    return this.httpClient.get<SoftwareOverview[]>('/api/category/' + id, { params: toHttpParams(filter), observe: 'response' })
      .pipe(map(toSoftwarePage));
  }

  /** One page (see SoftwareFilter.page) of software matching filter.q in any category. */
  public search(filter: SoftwareFilter): Observable<SoftwarePage> {
    return this.httpClient.get<SoftwareOverview[]>('/api/search', { params: toHttpParams(filter), observe: 'response' })
      .pipe(map(toSoftwarePage));
  }
}

/** Number of software cards per listing page: fills 2-, 3- and 4-column grids evenly. */
export const PAGE_SIZE = 24;

function toHttpParams(filter?: SoftwareFilter): HttpParams {
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
  return params;
}

/** The backend sends the item count across all pages in X-Total-Count. */
function toSoftwarePage(response: HttpResponse<SoftwareOverview[]>): SoftwarePage {
  const items = response.body ?? [];
  const total = Number(response.headers.get('X-Total-Count'));
  // An older backend without the header: only what was returned is known.
  return { items, total: Number.isFinite(total) && total >= items.length ? total : items.length };
}

export interface SoftwareFilter {
  status?: string;
  q?: string;
  /** 1-based page number; defaults to the first page. */
  page?: number;
}

export interface SoftwarePage {
  items: SoftwareOverview[];
  /** Number of matching software across all pages. */
  total: number;
}
export class Category {
  id!: string;
  name!: string;
  link!: string;
  /** URL of the category's SVG icon, if the database defines one. */
  icon?: string;
}

/** Must match the CPU values the backend accepts (no closed enum server-side, but this is the known set). */
export const CPU_ARCHITECTURES = ['x86-64', 'i386', 'arm64', 'ppc'];

export interface SoftwareOverview {
  name: string;
  shortName: string;
  lastVersion?: string;
  status?: string;
  screenshots?: string[];
  /** Scaled-down first screenshot for listing cards; absent from older backends. */
  preview?: string;
}

/** Must match the backend's validReportStatuses enum (validation.go). */
export const REPORT_STATUSES = ['platinum', 'gold', 'silver', 'bronze', 'garbage'];
