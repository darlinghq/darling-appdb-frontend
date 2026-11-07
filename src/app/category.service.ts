import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
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
          name: pickLocalizedName(value.name),
          link: '/category/' + key
        });
      }

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

  public getCategoryContents(id: string): Observable<SoftwareOverview[]> {
    return this.httpClient.get<SoftwareOverview[]>('/api/category/' + id);
  }
}
export class Category {
  name!: string;
  link!: string;
}

export interface SoftwareOverview {
  name: string;
  shortName: string;
  lastVersion?: string;
  status?: string;
}
