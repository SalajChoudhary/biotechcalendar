import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

import { CompanyResponse } from '../../../core/models/company.model';
import { CompanyService } from '../../../core/services/company.service';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatTableModule],
  templateUrl: './company-list.html',
  styleUrl: './company-list.css',
})
export class CompanyListComponent implements OnInit {
  private readonly companyService = inject(CompanyService);

  readonly companies = signal<CompanyResponse[]>([]);
  readonly searchTerm = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly displayedColumns = ['ticker', 'name', 'notes', 'actions'];

  readonly filteredCompanies = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const items = this.companies();

    if (!term) {
      return items;
    }

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

    this.companyService.getAll().subscribe({
      next: (companies) => {
        this.companies.set(companies);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load companies.');
        this.isLoading.set(false);
      },
    });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  deleteCompany(id: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this company?');

    if (!confirmed) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    this.companyService.delete(id).subscribe({
      next: () => {
        this.successMessage.set('Company deleted successfully.');
        this.companies.set(this.companies().filter((item) => item.id !== id));
      },
      error: () => {
        this.errorMessage.set('Failed to delete company.');
      },
    });
  }
}
