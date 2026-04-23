import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { CompanyResponse } from '../../../core/models/company.model';
import { CompanyService } from '../../../core/services/company.service';
import { extractErrorMessage } from '../../../shared/utils/http-error';

type SortField = 'name' | 'ticker';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './company-list.html',
  styleUrl: './company-list.css',
})
export class CompanyListComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly companies = signal<CompanyResponse[]>([]);
  readonly searchTerm = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly pageIndex = signal(0);
  readonly pageSize = signal(25);
  readonly totalElements = signal(0);
  readonly pageSizeOptions = [10, 25, 50, 100];

  readonly sortField = signal<SortField>('name');
  readonly sortDirection = signal<SortDirection>('asc');

  readonly displayedColumns = ['ticker', 'name', 'notes', 'actions'];

  readonly filteredCompanies = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const items = this.companies();

    if (!term) return items;

    return items.filter((item) =>
      [item.ticker, item.name, item.notes ?? ''].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  });

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const sort = `${this.sortField()},${this.sortDirection()}`;
    this.companyService
      .getCompanies({ page: this.pageIndex(), size: this.pageSize(), sort })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.companies.set(page.content);
          this.totalElements.set(page.totalElements);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(extractErrorMessage(err, 'Failed to load companies.'));
          this.isLoading.set(false);
        },
      });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadCompanies();
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.pageIndex.set(0);
    this.loadCompanies();
  }

  sortIndicator(field: SortField): string {
    if (this.sortField() !== field) return '';
    return this.sortDirection() === 'asc' ? ' ↑' : ' ↓';
  }

  deleteCompany(id: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this company?');
    if (!confirmed) return;

    this.errorMessage.set('');
    this.successMessage.set('');

    this.companyService
      .delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Company deleted successfully.');
          this.loadCompanies();
        },
        error: (err) => {
          this.errorMessage.set(extractErrorMessage(err, 'Failed to delete company.'));
        },
      });
  }
}
