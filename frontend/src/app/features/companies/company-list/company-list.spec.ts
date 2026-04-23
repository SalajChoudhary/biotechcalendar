import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CompanyListComponent } from './company-list';
import { environment } from '../../../../environments/environment';

describe('CompanyListComponent', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyListComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads paginated companies on init', async () => {
    const fixture = TestBed.createComponent(CompanyListComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const req = http.expectOne((r) => r.url === `${environment.apiBaseUrl}/companies`);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('25');
    req.flush({
      content: [{ id: 1, ticker: 'ACME', name: 'Acme', notes: null }],
      page: 0,
      size: 25,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });

    expect(fixture.componentInstance.companies().length).toBe(1);
    expect(fixture.componentInstance.totalElements()).toBe(1);
  });
});
