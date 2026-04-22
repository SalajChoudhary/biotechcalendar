import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { CompanyService } from './company.service';
import { CompanyRequest, CompanyResponse } from '../models';
import { environment } from '../../../environments/environment';

describe('CompanyService', () => {
  let service: CompanyService;
  let http: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/companies`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CompanyService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches all companies', () => {
    const payload: CompanyResponse[] = [];
    service.getAll().subscribe((result) => expect(result).toEqual(payload));

    const req = http.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(payload);
  });

  it('sends update via PUT /api/companies/:id', () => {
    const request: CompanyRequest = { ticker: 'ACME', name: 'Acme', notes: null };
    service.update(42, request).subscribe();

    const req = http.expectOne(`${apiUrl}/42`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('sends DELETE /api/companies/:id', () => {
    service.delete(7).subscribe();

    const req = http.expectOne(`${apiUrl}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
