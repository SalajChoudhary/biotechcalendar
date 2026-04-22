import { CommonModule } from '@angular/common';
import { afterNextRender, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { CatalystService } from '../../../core/services/catalyst.service';
import { CompanyService } from '../../../core/services/company.service';

// ... existing code ...

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
  ],
  templateUrl: './catalyst-form.html',
  styleUrl: './catalyst-form.css',
})
export class CatalystFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly catalystService = inject(CatalystService);
  private readonly companyService = inject(CompanyService);

  companies: Array<{ id: number; name: string; ticker: string }> = [];

  isSubmitting = false;
  isLoadingCompanies = false;
  successMessage = '';
  errorMessage = '';

  readonly form = this.fb.group({
    catalystType: ['', Validators.required],
    drugName: ['', Validators.required],
    companyId: [null as number | null, Validators.required],
    expectedDateStart: ['', Validators.required],
    expectedDateEnd: [''],
    notes: [''],
  });

  constructor() {
    afterNextRender(() => {
      this.loadCompanies();
    });
  }

  loadCompanies(): void {
    this.isLoadingCompanies = true;
    this.errorMessage = '';

    this.companyService.getAll().subscribe({
      next: (companies) => {
        this.companies = companies;
        this.isLoadingCompanies = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load companies.';
        this.isLoadingCompanies = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const value = this.form.getRawValue();

    const request = {
      catalystType: value.catalystType ?? '',
      drugName: value.drugName ?? '',
      companyId: Number(value.companyId),
      expectedDateStart: value.expectedDateStart ?? '',
      expectedDateEnd: value.expectedDateEnd || null,
      notes: value.notes || null,
    };

    this.catalystService.createCatalyst(request).subscribe({
      next: () => {
        this.successMessage = 'Catalyst created successfully.';
        this.errorMessage = '';
        this.isSubmitting = false;

        this.form.reset({
          catalystType: '',
          drugName: '',
          companyId: null,
          expectedDateStart: '',
          expectedDateEnd: '',
          notes: '',
        });
      },
      error: () => {
        this.errorMessage = 'Failed to create catalyst.';
        this.successMessage = '';
        this.isSubmitting = false;
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
}
