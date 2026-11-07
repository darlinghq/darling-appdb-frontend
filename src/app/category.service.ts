import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private httpClient: HttpClient) { }

  public getCategories(): Observable<Category[]> {
    return this.httpClient.get<object>('/api/category').pipe(map(o => {
      const rv = [];

      for (const [key, value] of Object.entries(o)) {
        rv.push({
          name: value.name,
          link: '/category/' + key
        });
      }

      return rv;
    }));
  }
}
export class Category {
  name!: string;
  link!: string;
}
