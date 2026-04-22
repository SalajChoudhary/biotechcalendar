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

  it('separates dated events into day cells and undated events into their own section', async () => {
    const fixture = TestBed.createComponent(CalendarViewComponent);
    fixture.componentInstance.currentDate.set(new Date('2026-04-15T12:00:00'));
    fixture.detectChanges();
    await fixture.whenStable();

    const catalysts = [
      makeCatalyst({ id: 1, expectedDateStart: '2026-04-22', expectedDateEnd: '2026-04-22' }),
      makeCatalyst({ id: 2, expectedDateStart: null, expectedDateEnd: null }),
      makeCatalyst({ id: 3, expectedDateStart: '2026-04-10', expectedDateEnd: null }),
    ];

    http.expectOne(`${environment.apiBaseUrl}/catalysts`).flush(catalysts);

    const cmp = fixture.componentInstance;
    expect(cmp.undatedEvents().length).toBe(1);
    expect(cmp.undatedEvents()[0].id).toBe(2);

    const allDatedEvents = cmp
      .weeks()
      .flat()
      .flatMap((day) => day.events);
    const ids = allDatedEvents.map((e) => e.id);
    expect(ids).toContain(1);
    expect(ids).toContain(3);
    expect(ids).not.toContain(2);
  });

  it('surfaces server error message when load fails', async () => {
    const fixture = TestBed.createComponent(CalendarViewComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    http.expectOne(`${environment.apiBaseUrl}/catalysts`).flush(
      { message: 'database offline' },
      { status: 500, statusText: 'Server Error' },
    );

    expect(fixture.componentInstance.errorMessage()).toBe('database offline');
  });
});
