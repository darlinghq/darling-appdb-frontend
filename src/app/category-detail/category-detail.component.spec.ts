import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, ParamMap, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

import { CategoryDetailComponent } from './category-detail.component';
import { MaterialModule } from '../material.module';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ScreenshotPlaceholderComponent } from '../screenshot-placeholder/screenshot-placeholder.component';

describe('CategoryDetailComponent', () => {
  let fixture: ComponentFixture<CategoryDetailComponent>;
  let httpMock: HttpTestingController;
  let queryParamMap: BehaviorSubject<ParamMap>;
  let route: object;

  beforeEach(() => {
    queryParamMap = new BehaviorSubject(convertToParamMap({}));
    route = { snapshot: { paramMap: convertToParamMap({ id: 'productivity' }) }, queryParamMap };

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, MaterialModule],
      declarations: [CategoryDetailComponent, StatusBadgeComponent, ScreenshotPlaceholderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: route }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CategoryDetailComponent);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /** Starts the component and answers the category-name lookup. */
  function start() {
    fixture.detectChanges();
    httpMock.expectOne('/api/category').flush({ productivity: { name: { en: 'Productivity' } } });
  }

  /** The pending request for the category's software. */
  function contents(): TestRequest {
    return httpMock.expectOne(r => r.url === '/api/category/productivity');
  }

  function flushPage(req: TestRequest, items: object[], total?: number) {
    req.flush(items, total === undefined ? {} : { headers: { 'X-Total-Count': String(total) } });
    fixture.detectChanges();
  }

  const el = () => fixture.nativeElement as HTMLElement;

  it('renders the software list once the HTTP response resolves', () => {
    start();
    flushPage(contents(), [{ name: 'pearCalc', shortName: 'pearcalc' }], 1);

    expect(el().textContent).toContain('pearCalc');
    expect(el().textContent).toContain('Productivity');
  });

  it('shows the first screenshot, or a placeholder for software without screenshots', () => {
    start();
    flushPage(contents(), [
      { name: 'With', shortName: 'with', screenshots: ['/shot.png'] },
      { name: 'Without', shortName: 'without' }
    ]);

    const cards = el().querySelectorAll('.software-card');
    expect(cards[0].querySelector('img.card-screenshot')?.getAttribute('src')).toBe('/shot.png');
    expect(cards[0].querySelector('app-screenshot-placeholder')).toBeNull();
    expect(cards[1].querySelector('img.card-screenshot')).toBeNull();
    expect(cards[1].querySelector('app-screenshot-placeholder')).not.toBeNull();
    // Long names and versions are clipped with an ellipsis; the full text stays available on hover.
    expect(cards[1].querySelector('.card-title')?.getAttribute('title')).toBe('Without');
  });

  it('makes each card a real link, so it can be opened in a new tab', () => {
    start();
    flushPage(contents(), [{ name: 'pearCalc', shortName: 'pearcalc' }, { name: 'Angry Birds', shortName: 'AngryBirds' }]);

    const links = el().querySelectorAll('a.software-link');
    expect(Array.from(links, a => a.getAttribute('href'))).toEqual(['/software/pearcalc', '/software/AngryBirds']);
    expect(links[0].querySelector('.software-card')?.textContent).toContain('pearCalc');
  });

  it('uses the scaled-down preview when the backend provides one', () => {
    start();
    flushPage(contents(), [{ name: 'App', shortName: 'app', screenshots: ['/shot.png'], preview: '/shot.png/preview' }]);

    expect(el().querySelector('img.card-screenshot')?.getAttribute('src')).toBe('/shot.png/preview');
  });

  it('requests the page, search text and status from the URL', () => {
    queryParamMap.next(convertToParamMap({ q: 'calc', status: 'gold', page: '3' }));
    start();
    const req = contents();
    expect(req.request.params.get('from')).toBe('48');
    expect(req.request.params.get('count')).toBe('24');
    expect(req.request.params.get('q')).toBe('calc');
    expect(req.request.params.get('status')).toBe('gold');
    flushPage(req, []);

    // A new URL is a new request.
    queryParamMap.next(convertToParamMap({ q: 'calc' }));
    const next = contents();
    expect(next.request.params.get('from')).toBe('0');
    expect(next.request.params.has('status')).toBe(false);
    flushPage(next, []);
  });

  it('shows the selected status as a badge in the filter, not as plain text', async () => {
    queryParamMap.next(convertToParamMap({ status: 'gold' }));
    start();
    flushPage(contents(), []);
    await fixture.whenStable();
    fixture.detectChanges();

    const trigger = el().querySelector('.mat-mdc-select-value')!;
    expect(trigger.querySelector('app-status-badge mat-icon')).not.toBeNull();
    expect(trigger.textContent).toContain('Gold');
  });

  it('shows "Any" in the filter when no status is selected', async () => {
    start();
    flushPage(contents(), []);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el().querySelector('.mat-mdc-select-value')?.textContent?.trim()).toBe('Any');
  });

  it('puts filter changes in the URL and goes back to the first page', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    start();
    flushPage(contents(), []);

    fixture.componentInstance.onStatusFilterChange('gold');
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
      relativeTo: route, queryParams: { status: 'gold', page: null }, queryParamsHandling: 'merge'
    }));

    fixture.componentInstance.onSearch('  calc ');
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { q: 'calc', page: null } }));

    fixture.componentInstance.onStatusFilterChange('');
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { status: null, page: null } }));
  });

  it('shows a paginator only when there is more than one page', () => {
    start();
    flushPage(contents(), [{ name: 'A', shortName: 'a' }], 24);
    expect(el().querySelector('mat-paginator')).toBeNull();

    queryParamMap.next(convertToParamMap({}));
    flushPage(contents(), [{ name: 'A', shortName: 'a' }], 50);
    expect(el().querySelector('mat-paginator')?.textContent).toContain('1 – 24 of 50');
  });

  it('moves to the chosen page through the URL', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    queryParamMap.next(convertToParamMap({ page: '2' }));
    start();
    flushPage(contents(), [{ name: 'A', shortName: 'a' }], 50);
    expect(el().querySelector('mat-paginator')?.textContent).toContain('25 – 48 of 50');

    (el().querySelector('button.mat-mdc-paginator-navigation-next') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { page: 3 } }));
    expect(window.scrollTo).toHaveBeenCalled();

    (el().querySelector('button.mat-mdc-paginator-navigation-first') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { page: null } }));
  });

  it('explains an empty page past the end instead of claiming nothing matches', () => {
    queryParamMap.next(convertToParamMap({ page: '9' }));
    start();
    flushPage(contents(), [], 30);

    expect(el().textContent).toContain('There is no page 9');
    expect(el().textContent).not.toContain('No software matches');
    expect(el().querySelector('.past-end a')?.textContent).toContain('Go to the first page');
    // The paginator would show a nonsensical range like "193 – 216 of 30".
    expect(el().querySelector('mat-paginator')).toBeNull();
  });

  it('says nothing matches when the filters leave no software', () => {
    start();
    flushPage(contents(), [], 0);
    expect(el().textContent).toContain('No software matches the current filters');
  });

  it('shows a not-found message when the category does not exist', () => {
    start();
    contents().flush('not found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(el().textContent).toContain('was not found');
  });
});
