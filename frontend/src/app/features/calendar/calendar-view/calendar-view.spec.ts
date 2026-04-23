import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { CalendarViewComponent } from './calendar-view';
import { CatalystResponse } from '../../../core/models/catalyst.model';
import { environment } from '../../../../environments/environment';

const rangeUrl = `${environment.apiBaseUrl}/catalysts/range`;
const undatedUrl = `${environment.apiBaseUrl}/catalysts/undated`;

function makeCatalyst(overrides: Partial<CatalystResponse>): CatalystResponse {
  return {
    id: 1,
    catalystType: 'Phase 2',
    drugName: 'Drug',
    companyName: 'Acme',
    companyTicker: 'ACME',
    expectedDateStart: null,
    expectedDateEnd: null,
    notes: null,
    source: 'MANUAL',
    externalId: null,
    ...overrides,
  };
}

describe('CalendarViewComponent', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarViewComponent, NoopAnimationsModule, MatDialogModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), MatDialog],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches range and undated on init and renders both', async () => {
    const fixture = TestBed.createComponent(CalendarViewComponent);
    fixture.componentInstance.currentDate.set(new Date(2026, 3, 15));
    fixture.detectChanges();
    await fixture.whenStable();

    const rangeReq = http.expectOne((r) => r.url === rangeUrl);
    expect(rangeReq.request.params.get('from')).toBeTruthy();
    expect(rangeReq.request.params.get('to')).toBeTruthy();
    rangeReq.flush([
      makeCatalyst({ id: 1, expectedDateStart: '2026-04-22', expectedDateEnd: '2026-04-22' }),
    ]);

    const undatedReq = http.expectOne(undatedUrl);
    undatedReq.flush([makeCatalyst({ id: 2, expectedDateStart: null, expectedDateEnd: null })]);

    const allDatedEvents = fixture.componentInstance
      .weeks()
      .flat()
      .flatMap((day) => day.events);
    expect(allDatedEvents.map((e) => e.id)).toContain(1);
    expect(fixture.componentInstance.undatedEvents()).toHaveLength(1);
    expect(fixture.componentInstance.undatedEvents()[0].id).toBe(2);
  });

  it('refetches range but not undated when the user navigates to the next month', async () => {
    const fixture = TestBed.createComponent(CalendarViewComponent);
    fixture.componentInstance.currentDate.set(new Date(2026, 3, 15));
    fixture.detectChanges();
    await fixture.whenStable();

    http.expectOne((r) => r.url === rangeUrl).flush([]);
    http.expectOne(undatedUrl).flush([]);

    fixture.componentInstance.nextMonth();
    const nextRangeReq = http.expectOne((r) => r.url === rangeUrl);
    nextRangeReq.flush([]);
    http.expectNone(undatedUrl);
  });

  it('surfaces server error message when range load fails', async () => {
    const fixture = TestBed.createComponent(CalendarViewComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    http.expectOne((r) => r.url === rangeUrl).flush(
      { message: 'database offline' },
      { status: 500, statusText: 'Server Error' },
    );
    http.expectOne(undatedUrl).flush([]);

    expect(fixture.componentInstance.errorMessage()).toBe('database offline');
  });
});
