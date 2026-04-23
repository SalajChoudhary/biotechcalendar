import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { CompanyService } from './company.service';
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

  it('fetches paginated companies', () => {
    service.getCompanies({ page: 1, size: 10, sort: 'name,asc' }).subscribe();
    const req = http.expectOne(
      (r) => r.url === apiUrl && r.params.get('page') === '1' && r.params.get('size') === '10',
    );
    expect(req.request.params.get('sort')).toBe('name,asc');
    req.flush({
      content: [],
      page: 1,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      first: false,
      last: true,
    });
  });

  it('fetches all companies from /all for selects', () => {
    service.getAll().subscribe();
    const req = http.expectOne(`${apiUrl}/all`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('sends update via PUT /api/companies/:id', () => {
    service.update(42, { ticker: 'ACME', name: 'Acme', notes: null }).subscribe();
    const req = http.expectOne(`${apiUrl}/42`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('sends DELETE /api/companies/:id', () => {
    service.delete(7).subscribe();
    const req = http.expectOne(`${apiUrl}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
