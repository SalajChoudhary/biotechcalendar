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

function pageOf(content: unknown[], totalElements = content.length) {
  return {
    content,
    page: 0,
    size: 25,
    totalElements,
    totalPages: Math.ceil(totalElements / 25) || 1,
    first: true,
    last: true,
  };
}

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

  it('loads paginated catalysts and companies on init', async () => {
    const fixture = TestBed.createComponent(CatalystListComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const catalystReq = http.expectOne((r) => r.url === `${environment.apiBaseUrl}/catalysts`);
    expect(catalystReq.request.params.get('page')).toBe('0');
    expect(catalystReq.request.params.get('size')).toBe('25');
    catalystReq.flush(
      pageOf([
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
      ]),
    );

    http.expectOne(`${environment.apiBaseUrl}/companies/all`).flush([
      { id: 1, ticker: 'ACME', name: 'Acme', notes: null },
    ]);

    expect(fixture.componentInstance.catalysts().length).toBe(1);
    expect(fixture.componentInstance.totalElements()).toBe(1);
    expect(fixture.componentInstance.companies().length).toBe(1);
  });

  it('groups catalysts by quarter when group mode is set', async () => {
    const fixture = TestBed.createComponent(CatalystListComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const catalysts = [
      {
        id: 1,
        catalystType: 'Phase 3',
        drugName: 'Drug-A',
        companyName: 'Acme',
        companyTicker: 'ACME',
        expectedDateStart: '2026-02-15',
        expectedDateEnd: null,
        notes: null,
        source: 'MANUAL',
        externalId: null,
      },
      {
        id: 2,
        catalystType: 'Phase 2',
        drugName: 'Drug-B',
        companyName: 'Acme',
        companyTicker: 'ACME',
        expectedDateStart: '2026-08-15',
        expectedDateEnd: null,
        notes: null,
        source: 'MANUAL',
        externalId: null,
      },
    ];
    http.expectOne((r) => r.url === `${environment.apiBaseUrl}/catalysts`).flush(pageOf(catalysts));
    http.expectOne(`${environment.apiBaseUrl}/companies/all`).flush([]);

    fixture.componentInstance.setGroupMode('quarter');
    const groups = fixture.componentInstance.groups();
    const labels = groups.map((g) => g.label);
    expect(labels).toContain('Q1 2026');
    expect(labels).toContain('Q3 2026');
  });

  it('groups by half-year with H1/H2 labels', async () => {
    const fixture = TestBed.createComponent(CatalystListComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const catalysts = [
      {
        id: 1,
        catalystType: 'Phase 3',
        drugName: 'Drug-A',
        companyName: 'Acme',
        companyTicker: 'ACME',
        expectedDateStart: '2026-02-15',
        expectedDateEnd: null,
        notes: null,
        source: 'MANUAL',
        externalId: null,
      },
      {
        id: 2,
        catalystType: 'Phase 2',
        drugName: 'Drug-B',
        companyName: 'Acme',
        companyTicker: 'ACME',
        expectedDateStart: '2026-08-15',
        expectedDateEnd: null,
        notes: null,
        source: 'MANUAL',
        externalId: null,
      },
    ];
    http.expectOne((r) => r.url === `${environment.apiBaseUrl}/catalysts`).flush(pageOf(catalysts));
    http.expectOne(`${environment.apiBaseUrl}/companies/all`).flush([]);

    fixture.componentInstance.setGroupMode('half');
    const labels = fixture.componentInstance.groups().map((g) => g.label);
    expect(labels).toContain('H1 2026');
    expect(labels).toContain('H2 2026');
  });
});
