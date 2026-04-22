import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CatalystListComponent } from './catalyst-list';
import { environment } from '../../../../environments/environment';

describe('CatalystListComponent', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalystListComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads catalysts and companies on init', async () => {
    const fixture = TestBed.createComponent(CatalystListComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const catalystsReq = http.expectOne(`${environment.apiBaseUrl}/catalysts`);
    catalystsReq.flush([
      {
        id: 1,
        catalystType: 'Phase 3',
        drugName: 'Drug-A',
        companyName: 'Acme',
        companyTicker: 'ACME',
        expectedDateStart: '2026-05-01',
        expectedDateEnd: null,
        notes: null,
        source: 'MANUAL',
        externalId: null,
      },
    ]);

    const companiesReq = http.expectOne(`${environment.apiBaseUrl}/companies`);
    companiesReq.flush([{ id: 1, ticker: 'ACME', name: 'Acme', notes: null }]);

    expect(fixture.componentInstance.catalysts().length).toBe(1);
    expect(fixture.componentInstance.companies().length).toBe(1);
  });

  it('surfaces server error message on load failure', async () => {
    const fixture = TestBed.createComponent(CatalystListComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    http.expectOne(`${environment.apiBaseUrl}/catalysts`).flush(
      { message: 'database offline' },
      { status: 500, statusText: 'Server Error' },
    );
    http.expectOne(`${environment.apiBaseUrl}/companies`).flush([]);

    expect(fixture.componentInstance.errorMessage()).toBe('database offline');
  });
});
