import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('extracts the English display name from the backend locale map', async () => {
    const resultPromise = firstValueFrom(service.getCategories());

    const req = httpMock.expectOne('/api/category');
    req.flush({
      business: { name: { en: 'Business', de: 'Geschäft' } }
    });

    expect(await resultPromise).toEqual([
      { name: 'Business', link: '/category/business' }
    ]);
  });

  it('falls back to any available locale when English is missing', async () => {
    const resultPromise = firstValueFrom(service.getCategories());

    const req = httpMock.expectOne('/api/category');
    req.flush({
      business: { name: { de: 'Geschäft' } }
    });

    expect(await resultPromise).toEqual([
      { name: 'Geschäft', link: '/category/business' }
    ]);
  });

  it('getCategoryName resolves the display name for a known id', async () => {
    const resultPromise = firstValueFrom(service.getCategoryName('productivity'));

    const req = httpMock.expectOne('/api/category');
    req.flush({
      productivity: { name: { en: 'Productivity' } }
    });

    expect(await resultPromise).toBe('Productivity');
  });

  it('getCategoryName falls back to the id when the category is unknown', async () => {
    const resultPromise = firstValueFrom(service.getCategoryName('does-not-exist'));

    const req = httpMock.expectOne('/api/category');
    req.flush({
      productivity: { name: { en: 'Productivity' } }
    });

    expect(await resultPromise).toBe('does-not-exist');
  });
});
