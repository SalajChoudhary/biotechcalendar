import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { CatalystService } from './catalyst.service';
import { CatalystRequest, Page, CatalystResponse } from '../models';
import { environment } from '../../../environments/environment';

describe('CatalystService', () => {
  let service: CatalystService;
  let http: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/catalysts`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CatalystService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches paginated catalysts with page params', () => {
    const payload: Page<CatalystResponse> = {
      content: [],
      page: 0,
      size: 25,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    };
    service.getCatalysts({ page: 0, size: 25, sort: 'expectedDateStart,desc' }).subscribe((r) =>
      expect(r).toEqual(payload),
    );

    const req = http.expectOne(
      (r) => r.url === apiUrl && r.params.get('page') === '0' && r.params.get('size') === '25',
    );
    expect(req.request.params.get('sort')).toBe('expectedDateStart,desc');
    req.flush(payload);
  });

  it('fetches catalysts in date range', () => {
    service.getCatalystsInRange('2026-04-01', '2026-04-30').subscribe();
    const req = http.expectOne(
      (r) =>
        r.url === `${apiUrl}/range` &&
        r.params.get('from') === '2026-04-01' &&
        r.params.get('to') === '2026-04-30',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('fetches undated catalysts', () => {
    service.getUndatedCatalysts().subscribe();
    const req = http.expectOne(`${apiUrl}/undated`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('posts new catalyst to POST /api/catalysts', () => {
    const request: CatalystRequest = {
      catalystType: 'Phase 3',
      drugName: 'Acmezumab',
      companyId: 1,
      expectedDateStart: '2026-05-01',
      expectedDateEnd: null,
      notes: null,
    };
    service.createCatalyst(request).subscribe();

    const req = http.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('sends update via PUT /api/catalysts/:id', () => {
    service
      .updateCatalyst(42, {
        catalystType: 'Phase 3',
        drugName: 'D',
        companyId: 1,
        expectedDateStart: '2026-05-01',
        expectedDateEnd: null,
        notes: null,
      })
      .subscribe();

    const req = http.expectOne(`${apiUrl}/42`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('sends DELETE /api/catalysts/:id', () => {
    service.deleteCatalyst(7).subscribe();
    const req = http.expectOne(`${apiUrl}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('posts to import endpoint with companyId', () => {
    service.importFromClinicalTrials(5).subscribe();
    const req = http.expectOne(`${environment.apiBaseUrl}/import/clinicaltrials/5`);
    expect(req.request.method).toBe('POST');
    req.flush({ imported: 0, message: 'ok' });
  });
});
