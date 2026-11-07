import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { CategoryDetailComponent } from './category-detail.component';
import { MaterialModule } from '../material.module';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

describe('CategoryDetailComponent', () => {
  let fixture: ComponentFixture<CategoryDetailComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, MaterialModule],
      declarations: [CategoryDetailComponent, StatusBadgeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'productivity' }) }
          }
        }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CategoryDetailComponent);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('renders the software list once the HTTP response resolves', () => {
    fixture.detectChanges();

    httpMock.expectOne('/api/category').flush({
      productivity: { name: { en: 'Productivity' } }
    });
    httpMock.expectOne('/api/category/productivity').flush([
      { name: 'pearCalc', shortName: 'pearcalc' }
    ]);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('pearCalc');
    expect(compiled.textContent).toContain('Productivity');
  });

  it('re-fetches with status and q query params when the filters change', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url === '/api/category').flush({});
    httpMock.expectOne(r => r.url === '/api/category/productivity').flush([]);

    fixture.componentInstance.onStatusFilterChange('gold');
    httpMock.expectOne(r => r.url === '/api/category/productivity' && r.params.get('status') === 'gold').flush([]);

    fixture.componentInstance.onSearch('calc');
    httpMock.expectOne(r =>
      r.url === '/api/category/productivity' && r.params.get('status') === 'gold' && r.params.get('q') === 'calc'
    ).flush([]);
  });

  it('shows a not-found message when the category does not exist', () => {
    fixture.detectChanges();

    httpMock.expectOne('/api/category').flush({});
    httpMock.expectOne('/api/category/productivity').flush('not found', { status: 404, statusText: 'Not Found' });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('was not found');
  });
});
