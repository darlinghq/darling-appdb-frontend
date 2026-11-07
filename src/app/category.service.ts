import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';

/** Raw shape of one entry in the backend's GET /api/category map response. */
interface RawCategory {
  name: { [locale: string]: string };
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
          link: '/category/' + key
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

  public getCategoryContents(id: string, filter?: SoftwareFilter): Observable<SoftwareOverview[]> {
    return this.httpClient.get<SoftwareOverview[]>('/api/category/' + id, { params: toHttpParams(filter) });
  }

  public search(filter: SoftwareFilter): Observable<SoftwareOverview[]> {
    return this.httpClient.get<SoftwareOverview[]>('/api/search', { params: toHttpParams(filter) });
  }
}

function toHttpParams(filter?: SoftwareFilter): HttpParams {
  let params = new HttpParams();
  if (filter?.status) {
    params = params.set('status', filter.status);
  }
  if (filter?.q) {
    params = params.set('q', filter.q);
  }
  return params;
}

export interface SoftwareFilter {
  status?: string;
  q?: string;
}
export class Category {
  id!: string;
  name!: string;
  link!: string;
}

/** Must match the CPU values the backend accepts (no closed enum server-side, but this is the known set). */
export const CPU_ARCHITECTURES = ['x86-64', 'i386', 'arm64'];

export interface SoftwareOverview {
  name: string;
  shortName: string;
  lastVersion?: string;
  status?: string;
  screenshots?: string[];
}

/** Must match the backend's validReportStatuses enum (validation.go). */
export const REPORT_STATUSES = ['platinum', 'gold', 'silver', 'bronze', 'garbage'];
