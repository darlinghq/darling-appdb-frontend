import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

import { SearchResultsComponent } from './search-results.component';
import { MaterialModule } from '../material.module';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

describe('SearchResultsComponent', () => {
  let fixture: ComponentFixture<SearchResultsComponent>;
  let httpMock: HttpTestingController;
  let queryParamMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(() => {
    queryParamMap = new BehaviorSubject(convertToParamMap({ q: 'pear' }));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, MaterialModule],
      declarations: [SearchResultsComponent, StatusBadgeComponent],
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
});
