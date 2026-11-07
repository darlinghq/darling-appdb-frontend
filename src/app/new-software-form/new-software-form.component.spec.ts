import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { NewSoftwareFormComponent } from './new-software-form.component';
import { MaterialModule } from '../material.module';
import { CPU_ARCHITECTURES } from '../category.service';

describe('NewSoftwareFormComponent', () => {
  let fixture: ComponentFixture<NewSoftwareFormComponent>;
  let component: NewSoftwareFormComponent;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, ReactiveFormsModule, MaterialModule],
      declarations: [NewSoftwareFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NewSoftwareFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock.expectOne('/api/category').flush({
      productivity: { name: { en: 'Productivity' } },
      business: { name: { en: 'Business' } }
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads the category list for the multi-select', () => {
    expect(component.categories()?.map(c => c.id)).toEqual(['business', 'productivity']);
  });

  it('offers i386 alongside x86-64 and arm64', () => {
    expect(CPU_ARCHITECTURES).toEqual(['x86-64', 'i386', 'arm64']);
    expect(component.cpuArchitectures).toEqual(CPU_ARCHITECTURES);
  });

  it('defaults cpu to x86-64 and requires at least one category', () => {
    expect(component.form.value.cpu).toEqual(['x86-64']);
    expect(component.form.valid).toBe(false);

    component.form.patchValue({ name: 'testapp', productLink: 'https://example.com', categories: ['business'] });
    expect(component.form.valid).toBe(true);
  });

  it('submits categories and cpu as arrays, not a comma-joined string', () => {
    component.form.setValue({
      name: 'testapp',
      productLink: 'https://example.com',
      categories: ['business', 'productivity'],
      cpu: ['x86-64', 'i386'],
      free: true
    });

    component.submit();

    const req = httpMock.expectOne('/api/software');
    expect(req.request.body.categories).toEqual(['business', 'productivity']);
    expect(req.request.body.cpu).toEqual(['x86-64', 'i386']);
    req.flush({ prUrl: 'https://github.com/x/y/pull/1', prNumber: 1 });
  });
});
