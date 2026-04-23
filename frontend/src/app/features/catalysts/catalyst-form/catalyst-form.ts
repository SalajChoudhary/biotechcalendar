import { CommonModule } from '@angular/common';
import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CatalystService } from '../../../core/services/catalyst.service';
import { CompanyService } from '../../../core/services/company.service';
import { CatalystRequest } from '../../../core/models/catalyst.model';
import { CompanyResponse } from '../../../core/models/company.model';
import { extractErrorMessage } from '../../../shared/utils/http-error';

@Component({
  selector: 'app-catalyst-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    RouterLink,
  ],
  templateUrl: './catalyst-form.html',
  styleUrl: './catalyst-form.css',
})
export class CatalystFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly catalystService = inject(CatalystService);
  private readonly companyService = inject(CompanyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly companies = signal<CompanyResponse[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly isSubmitting = signal(false);
  readonly isLoadingCompanies = signal(false);
  readonly isLoadingCatalyst = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = this.fb.group(
    {
      catalystType: ['', Validators.required],
      drugName: ['', Validators.required],
      companyId: [null as number | null, Validators.required],
      expectedDateStart: ['', Validators.required],
      expectedDateEnd: [''],
      notes: [''],
    },
    { validators: dateRangeValidator },
  );

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isNaN(id) && id > 0) {
      this.editingId.set(id);
    }

    afterNextRender(() => {
      this.loadCompanies(this.editingId());
    });
  }

  private loadCompanies(editingId: number | null): void {
    this.isLoadingCompanies.set(true);
    this.errorMessage.set('');

    this.companyService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (companies) => {
          this.companies.set(companies);
          this.isLoadingCompanies.set(false);
          if (editingId !== null) {
            this.loadCatalyst(editingId);
          }
        },
        error: (err) => {
          this.errorMessage.set(extractErrorMessage(err, 'Failed to load companies.'));
          this.isLoadingCompanies.set(false);
        },
      });
  }

  private loadCatalyst(id: number): void {
    this.isLoadingCatalyst.set(true);

    this.catalystService
      .getCatalystById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalyst) => {
          const match = this.companies().find(
            (c) => c.ticker === catalyst.companyTicker && c.name === catalyst.companyName,
          );
          this.form.patchValue({
            catalystType: catalyst.catalystType,
            drugName: catalyst.drugName,
            companyId: match?.id ?? null,
            expectedDateStart: catalyst.expectedDateStart ?? '',
            expectedDateEnd: catalyst.expectedDateEnd ?? '',
            notes: catalyst.notes ?? '',
          });
          this.isLoadingCatalyst.set(false);
        },
        error: (err) => {
          this.errorMessage.set(extractErrorMessage(err, 'Failed to load catalyst.'));
          this.isLoadingCatalyst.set(false);
        },
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const value = this.form.getRawValue();

    const request: CatalystRequest = {
      catalystType: value.catalystType ?? '',
      drugName: value.drugName ?? '',
      companyId: Number(value.companyId),
      expectedDateStart: value.expectedDateStart ?? '',
      expectedDateEnd: value.expectedDateEnd || null,
      notes: value.notes || null,
    };

    const id = this.editingId();
    const request$ = id
      ? this.catalystService.updateCatalyst(id, request)
      : this.catalystService.createCatalyst(request);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        if (id) {
          this.router.navigate(['/catalysts']);
        } else {
          this.successMessage.set('Catalyst created successfully.');
          this.form.reset({
            catalystType: '',
            drugName: '',
            companyId: null,
            expectedDateStart: '',
            expectedDateEnd: '',
            notes: '',
          });
        }
      },
      error: (err) => {
        this.errorMessage.set(
          extractErrorMessage(
            err,
            id ? 'Failed to update catalyst.' : 'Failed to create catalyst.',
          ),
        );
        this.successMessage.set('');
        this.isSubmitting.set(false);
      },
    });
  }

  get catalystType() {
    return this.form.controls.catalystType;
  }

  get drugName() {
    return this.form.controls.drugName;
  }

  get companyId() {
    return this.form.controls.companyId;
  }

  get expectedDateStart() {
    return this.form.controls.expectedDateStart;
  }

  get expectedDateEnd() {
    return this.form.controls.expectedDateEnd;
  }

  get notes() {
    return this.form.controls.notes;
  }

  get hasDateRangeError(): boolean {
    return this.form.hasError('dateRange') && this.expectedDateEnd.touched;
  }
}

function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('expectedDateStart')?.value;
  const end = group.get('expectedDateEnd')?.value;
  if (!start || !end) return null;
  return end < start ? { dateRange: true } : null;
}
