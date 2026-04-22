import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { CatalystService } from './catalyst.service';
import { CatalystRequest, CatalystResponse } from '../models';
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

  it('fetches all catalysts via GET', () => {
    const payload: CatalystResponse[] = [];
    service.getAllCatalysts().subscribe((result) => expect(result).toEqual(payload));

    const req = http.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(payload);
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
    const request: CatalystRequest = {
      catalystType: 'Phase 3',
      drugName: 'Acmezumab',
      companyId: 1,
      expectedDateStart: '2026-05-01',
      expectedDateEnd: '2026-06-01',
      notes: null,
    };
    service.updateCatalyst(42, request).subscribe();

    const req = http.expectOne(`${apiUrl}/42`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
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
