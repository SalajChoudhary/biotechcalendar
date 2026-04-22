import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

import { CompanyFormComponent } from './company-form';
import { environment } from '../../../../environments/environment';

async function setup(idParam: string | null) {
  await TestBed.configureTestingModule({
    imports: [CompanyFormComponent, NoopAnimationsModule],
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

  const fixture = TestBed.createComponent(CompanyFormComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  return {
    fixture,
    http: TestBed.inject(HttpTestingController),
    router: TestBed.inject(Router),
  };
}

describe('CompanyFormComponent', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('stays in create mode when no id param is present', async () => {
    const { fixture } = await setup(null);
    expect(fixture.componentInstance.editingId()).toBeNull();
  });

  it('loads existing company when id param is present', async () => {
    const { fixture, http } = await setup('7');

    const req = http.expectOne(`${environment.apiBaseUrl}/companies/7`);
    req.flush({ id: 7, ticker: 'ACME', name: 'Acme Biotech', notes: 'Tracked' });

    const cmp = fixture.componentInstance;
    expect(cmp.editingId()).toBe(7);
    expect(cmp.form.value.ticker).toBe('ACME');
    expect(cmp.form.value.name).toBe('Acme Biotech');
    expect(cmp.form.value.notes).toBe('Tracked');
  });

  it('submits PUT on update and navigates back to list', async () => {
    const { fixture, http, router } = await setup('7');
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http.expectOne(`${environment.apiBaseUrl}/companies/7`).flush({
      id: 7,
      ticker: 'ACME',
      name: 'Acme',
      notes: null,
    });

    const cmp = fixture.componentInstance;
    cmp.form.patchValue({ name: 'Acme Biotech Inc' });
    cmp.submit();

    const updateReq = http.expectOne(`${environment.apiBaseUrl}/companies/7`);
    expect(updateReq.request.method).toBe('PUT');
    expect(updateReq.request.body.name).toBe('Acme Biotech Inc');
    updateReq.flush({});

    expect(navigateSpy).toHaveBeenCalledWith(['/companies']);
  });

  it('submits POST on create', async () => {
    const { fixture, http } = await setup(null);

    const cmp = fixture.componentInstance;
    cmp.form.patchValue({ ticker: 'NEW', name: 'New Co', notes: '' });
    cmp.submit();

    const createReq = http.expectOne(`${environment.apiBaseUrl}/companies`);
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body).toEqual({ ticker: 'NEW', name: 'New Co', notes: null });
    createReq.flush({});
  });
});
