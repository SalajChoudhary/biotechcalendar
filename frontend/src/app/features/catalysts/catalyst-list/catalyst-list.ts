import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { CatalystResponse } from '../../../core/models/catalyst.model';
import { CompanyResponse } from '../../../core/models/company.model';
import { CatalystService } from '../../../core/services/catalyst.service';
import { CompanyService } from '../../../core/services/company.service';
import { extractErrorMessage } from '../../../shared/utils/http-error';

@Component({
  selector: 'app-catalyst-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './catalyst-list.html',
  styleUrl: './catalyst-list.css',
})
export class CatalystListComponent implements OnInit {
  private readonly catalystService = inject(CatalystService);
  private readonly companyService = inject(CompanyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly catalysts = signal<CatalystResponse[]>([]);
  readonly companies = signal<CompanyResponse[]>([]);
  readonly searchTerm = signal('');
  readonly selectedCompanyId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly isImporting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly displayedColumns = [
    'drugName',
    'catalystType',
    'company',
    'expectedDateStart',
    'expectedDateEnd',
    'source',
    'notes',
    'actions',
  ];

  readonly filteredCatalysts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const items = this.catalysts();

    if (!term) {
      return items;
    }

    return items.filter((item) =>
      [
        item.drugName,
        item.catalystType,
        item.companyName ?? '',
        item.companyTicker ?? '',
        item.notes ?? '',
        item.source ?? '',
        item.externalId ?? '',
      ].some((value) => value.toLowerCase().includes(term)),
    );
  });

  ngOnInit(): void {
    this.loadCatalysts();
    this.loadCompanies();
  }

  loadCatalysts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.catalystService
      .getAllCatalysts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalysts) => {
          this.catalysts.set(catalysts);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(extractErrorMessage(err, 'Failed to load catalysts.'));
          this.isLoading.set(false);
        },
      });
  }

  loadCompanies(): void {
    this.companyService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (companies) => this.companies.set(companies),
        error: (err) => {
          this.errorMessage.set(extractErrorMessage(err, 'Failed to load companies.'));
        },
      });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  importFromClinicalTrials(): void {
    const companyId = this.selectedCompanyId();
    if (companyId === null) return;

    this.isImporting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.catalystService
      .importFromClinicalTrials(companyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.successMessage.set(result.message);
          this.isImporting.set(false);
          this.loadCatalysts();
        },
        error: (err) => {
          this.errorMessage.set(
            extractErrorMessage(err, 'Failed to import from ClinicalTrials.gov.'),
          );
          this.isImporting.set(false);
        },
      });
  }

  deleteCatalyst(id: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this catalyst?');

    if (!confirmed) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    this.catalystService
      .deleteCatalyst(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Catalyst deleted successfully.');
          this.catalysts.set(this.catalysts().filter((item) => item.id !== id));
        },
        error: (err) => {
          this.errorMessage.set(extractErrorMessage(err, 'Failed to delete catalyst.'));
        },
      });
  }
}
