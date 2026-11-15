import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { SoftwareService, VersionDetail } from './software.service';

describe('SoftwareService', () => {
  let http: HttpTestingController;
  let service: SoftwareService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(SoftwareService);
  });

  it('getVersion requests the encoded version URL', () => {
    const detail: VersionDetail = { version: '1.0/b', download: '', issues: [], reports: [] };
    let got: VersionDetail | undefined;
    service.getVersion('my app', '1.0/b').subscribe(v => got = v);
    http.expectOne('/api/software/my%20app/versions/1.0%2Fb').flush(detail);
    expect(got).toEqual(detail);
  });
});
