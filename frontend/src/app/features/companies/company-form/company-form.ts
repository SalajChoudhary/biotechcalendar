import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CompanyService } from '../../../core/services/company.service';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './company-form.html',
  styleUrl: './company-form.css',
})
export class CompanyFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  readonly form = this.fb.group({
    ticker: ['', Validators.required],
    name: ['', Validators.required],
    notes: [''],
  });

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
      ticker: value.ticker?.trim() ?? '',
      name: value.name?.trim() ?? '',
      notes: value.notes?.trim() || null,
    };

    this.companyService.create(request).subscribe({
      next: () => {
        this.successMessage = 'Company created successfully.';
        this.errorMessage = '';
        this.isSubmitting = false;

        this.form.reset({
          ticker: '',
          name: '',
          notes: '',
        });
      },
      error: () => {
        this.errorMessage = 'Failed to create company.';
        this.successMessage = '';
        this.isSubmitting = false;
      },
    });
  }

  get ticker() {
    return this.form.controls.ticker;
  }

  get name() {
    return this.form.controls.name;
  }

  get notes() {
    return this.form.controls.notes;
  }
}
