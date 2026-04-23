import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

import { CatalystFormComponent } from './catalyst-form';
import { environment } from '../../../../environments/environment';

async function setup(idParam: string | null) {
  await TestBed.configureTestingModule({
    imports: [CatalystFormComponent, NoopAnimationsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: (k: string) => (k === 'id' ? idParam : null) } } },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CatalystFormComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  return {
    fixture,
    http: TestBed.inject(HttpTestingController),
    router: TestBed.inject(Router),
  };
}

function flushCompanies(http: HttpTestingController) {
  http.match(`${environment.apiBaseUrl}/companies/all`).forEach((r) =>
    r.flush([{ id: 1, ticker: 'ACME', name: 'Acme Biotech', notes: null }]),
  );
}

describe('CatalystFormComponent', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('stays in create mode when no id param is present', async () => {
    const { fixture, http } = await setup(null);
    flushCompanies(http);
    expect(fixture.componentInstance.editingId()).toBeNull();
  });

  it('switches to edit mode and loads catalyst when id param is present', async () => {
    const { fixture, http } = await setup('42');
    flushCompanies(http);

    const catalystReq = http.expectOne(`${environment.apiBaseUrl}/catalysts/42`);
    catalystReq.flush({
      id: 42,
      catalystType: 'Phase 3',
      drugName: 'Drug-X',
      companyName: 'Acme Biotech',
      companyTicker: 'ACME',
      expectedDateStart: '2026-05-01',
      expectedDateEnd: '2026-06-01',
      notes: 'important',
      source: 'MANUAL',
      externalId: null,
    });

    const cmp = fixture.componentInstance;
    expect(cmp.editingId()).toBe(42);
    expect(cmp.form.value.catalystType).toBe('Phase 3');
    expect(cmp.form.value.companyId).toBe(1);
    expect(cmp.form.value.expectedDateStart).toBe('2026-05-01');
    expect(cmp.form.value.expectedDateEnd).toBe('2026-06-01');
  });

  it('submits PUT on update and navigates back to list', async () => {
    const { fixture, http, router } = await setup('42');
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    flushCompanies(http);
    http.expectOne(`${environment.apiBaseUrl}/catalysts/42`).flush({
      id: 42,
      catalystType: 'Phase 2',
      drugName: 'Drug-X',
      companyName: 'Acme Biotech',
      companyTicker: 'ACME',
      expectedDateStart: '2026-01-01',
      expectedDateEnd: null,
      notes: null,
      source: 'MANUAL',
      externalId: null,
    });

    const cmp = fixture.componentInstance;
    cmp.form.patchValue({ catalystType: 'Phase 3' });
    cmp.submit();

    const updateReq = http.expectOne(`${environment.apiBaseUrl}/catalysts/42`);
    expect(updateReq.request.method).toBe('PUT');
    expect(updateReq.request.body.catalystType).toBe('Phase 3');
    updateReq.flush({});

    expect(navigateSpy).toHaveBeenCalledWith(['/catalysts']);
  });

  it('submits POST on create', async () => {
    const { fixture, http } = await setup(null);
    flushCompanies(http);

    const cmp = fixture.componentInstance;
    cmp.form.patchValue({
      catalystType: 'Phase 3',
      drugName: 'Acmezumab',
      companyId: 1,
      expectedDateStart: '2026-05-01',
      expectedDateEnd: '2026-06-01',
      notes: '',
    });
    cmp.submit();

    const createReq = http.expectOne(`${environment.apiBaseUrl}/catalysts`);
    expect(createReq.request.method).toBe('POST');
    createReq.flush({});
  });

  it('blocks submit when end date precedes start date', async () => {
    const { fixture, http } = await setup(null);
    flushCompanies(http);

    const cmp = fixture.componentInstance;
    cmp.form.patchValue({
      catalystType: 'Phase 3',
      drugName: 'Drug',
      companyId: 1,
      expectedDateStart: '2026-06-01',
      expectedDateEnd: '2026-05-01',
    });
    expect(cmp.form.hasError('dateRange')).toBe(true);

    cmp.submit();
    http.expectNone(`${environment.apiBaseUrl}/catalysts`);
  });
});
