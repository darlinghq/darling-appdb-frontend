import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

import { SearchResultsComponent } from './search-results.component';
import { MaterialModule } from '../material.module';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ScreenshotPlaceholderComponent } from '../screenshot-placeholder/screenshot-placeholder.component';

describe('SearchResultsComponent', () => {
  let fixture: ComponentFixture<SearchResultsComponent>;
  let httpMock: HttpTestingController;
  let queryParamMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(() => {
    queryParamMap = new BehaviorSubject(convertToParamMap({ q: 'pear' }));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, MaterialModule],
      declarations: [SearchResultsComponent, StatusBadgeComponent, ScreenshotPlaceholderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { queryParamMap } }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SearchResultsComponent);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('searches using the q query param and renders matches', () => {
    fixture.detectChanges();

    httpMock.expectOne(r => r.url === '/api/search' && r.params.get('q') === 'pear')
      .flush([{ name: 'pearCalc', shortName: 'pearcalc' }]);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('pearCalc');
  });

  it('re-searches when the query param changes', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url === '/api/search' && r.params.get('q') === 'pear').flush([]);

    queryParamMap.next(convertToParamMap({ q: 'other' }));
    fixture.detectChanges();

    httpMock.expectOne(r => r.url === '/api/search' && r.params.get('q') === 'other').flush([]);
  });

  it('shows a no-results message for an empty match list', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url === '/api/search').flush([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No software matches');
  });

  it('requests the page and status from the URL and shows a paginator for several pages', () => {
    queryParamMap.next(convertToParamMap({ q: 'pear', status: 'gold', page: '2' }));
    fixture.detectChanges();

    const req = httpMock.expectOne(r => r.url === '/api/search');
    expect(req.request.params.get('from')).toBe('24');
    expect(req.request.params.get('status')).toBe('gold');
    req.flush([{ name: 'pearCalc', shortName: 'pearcalc' }], { headers: { 'X-Total-Count': '30' } });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('mat-paginator')?.textContent).toContain('25 – 30 of 30');
  });

  it('puts the status filter and page in the URL', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    fixture.detectChanges();
    httpMock.expectOne(r => r.url === '/api/search').flush([]);

    fixture.componentInstance.onStatusFilterChange('gold');
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { status: 'gold', page: null } }));

    fixture.componentInstance.onPage({ pageIndex: 1, previousPageIndex: 0, pageSize: 24, length: 30 });
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { page: 2 } }));
  });

  it('does not search without a query', () => {
    queryParamMap.next(convertToParamMap({}));
    fixture.detectChanges();
    httpMock.expectNone(r => r.url === '/api/search');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No software matches');
  });
});
