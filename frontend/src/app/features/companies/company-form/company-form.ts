import { CommonModule } from '@angular/common';
import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CompanyService } from '../../../core/services/company.service';
import { CompanyRequest } from '../../../core/models/company.model';
import { extractErrorMessage } from '../../../shared/utils/http-error';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink,
  ],
  templateUrl: './company-form.html',
  styleUrl: './company-form.css',
})
export class CompanyFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly editingId = signal<number | null>(null);
  readonly isSubmitting = signal(false);
  readonly isLoadingCompany = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = this.fb.group({
    ticker: ['', Validators.required],
    name: ['', Validators.required],
    notes: [''],
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isNaN(id) && id > 0) {
      this.editingId.set(id);
      afterNextRender(() => this.loadCompany(id));
    }
  }

  private loadCompany(id: number): void {
    this.isLoadingCompany.set(true);
    this.errorMessage.set('');

    this.companyService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (company) => {
          this.form.patchValue({
            ticker: company.ticker,
            name: company.name,
            notes: company.notes ?? '',
          });
          this.isLoadingCompany.set(false);
        },
        error: (err) => {
          this.errorMessage.set(extractErrorMessage(err, 'Failed to load company.'));
          this.isLoadingCompany.set(false);
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

    const request: CompanyRequest = {
      ticker: value.ticker?.trim() ?? '',
      name: value.name?.trim() ?? '',
      notes: value.notes?.trim() || null,
    };

    const id = this.editingId();
    const request$ = id
      ? this.companyService.update(id, request)
      : this.companyService.create(request);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        if (id) {
          this.router.navigate(['/companies']);
        } else {
          this.successMessage.set('Company created successfully.');
          this.form.reset({ ticker: '', name: '', notes: '' });
        }
      },
      error: (err) => {
        this.errorMessage.set(
          extractErrorMessage(err, id ? 'Failed to update company.' : 'Failed to create company.'),
        );
        this.successMessage.set('');
        this.isSubmitting.set(false);
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
