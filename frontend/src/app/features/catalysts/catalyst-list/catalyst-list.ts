import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { CatalystResponse } from '../../../core/models/catalyst.model';
import { CompanyResponse } from '../../../core/models/company.model';
import { CatalystService } from '../../../core/services/catalyst.service';
import { CompanyService } from '../../../core/services/company.service';
import { extractErrorMessage } from '../../../shared/utils/http-error';

type GroupMode = 'flat' | 'quarter' | 'half';
type SortDirection = 'asc' | 'desc';

interface CatalystGroup {
  label: string;
  items: CatalystResponse[];
}

@Component({
  selector: 'app-catalyst-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatPaginatorModule,
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

  readonly pageIndex = signal(0);
  readonly pageSize = signal(25);
  readonly totalElements = signal(0);
  readonly pageSizeOptions = [10, 25, 50, 100];

  readonly sortDirection = signal<SortDirection>('desc');
  readonly groupMode = signal<GroupMode>('flat');

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

    if (!term) return items;

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

  readonly groups = computed<CatalystGroup[]>(() => {
    const items = this.filteredCatalysts();
    const mode = this.groupMode();

    if (mode === 'flat') {
      return [{ label: '', items }];
    }

    const buckets = new Map<string, { label: string; sortKey: string; items: CatalystResponse[] }>();
    for (const item of items) {
      const date = item.expectedDateEnd ?? item.expectedDateStart;
      const key = bucketKey(date, mode);
      const label = bucketLabel(date, mode);
      const sortKey = bucketSortKey(date, mode);
      if (!buckets.has(key)) buckets.set(key, { label, sortKey, items: [] });
      buckets.get(key)!.items.push(item);
    }

    const sorted = Array.from(buckets.values()).sort((a, b) => {
      return this.sortDirection() === 'asc'
        ? a.sortKey.localeCompare(b.sortKey)
        : b.sortKey.localeCompare(a.sortKey);
    });

    return sorted.map((b) => ({ label: b.label, items: b.items }));
  });

  ngOnInit(): void {
    this.loadCatalysts();
    this.loadCompanies();
  }

  loadCatalysts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const sort = `expectedDateStart,${this.sortDirection()}`;
    this.catalystService
      .getCatalysts({ page: this.pageIndex(), size: this.pageSize(), sort })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.catalysts.set(page.content);
          this.totalElements.set(page.totalElements);
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

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadCatalysts();
  }

  toggleSortDirection(): void {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    this.pageIndex.set(0);
    this.loadCatalysts();
  }

  setGroupMode(mode: GroupMode): void {
    this.groupMode.set(mode);
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
    if (!confirmed) return;

    this.errorMessage.set('');
    this.successMessage.set('');

    this.catalystService
      .deleteCatalyst(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Catalyst deleted successfully.');
          this.loadCatalysts();
        },
        error: (err) => {
          this.errorMessage.set(extractErrorMessage(err, 'Failed to delete catalyst.'));
        },
      });
  }
}

function bucketKey(date: string | null, mode: GroupMode): string {
  if (!date) return 'undated';
  const [y, m] = date.split('-');
  if (mode === 'quarter') {
    const q = Math.floor((Number(m) - 1) / 3) + 1;
    return `${y}-Q${q}`;
  }
  const h = Number(m) <= 6 ? 1 : 2;
  return `${y}-H${h}`;
}

function bucketLabel(date: string | null, mode: GroupMode): string {
  if (!date) return 'Undated';
  const [y, m] = date.split('-');
  if (mode === 'quarter') {
    const q = Math.floor((Number(m) - 1) / 3) + 1;
    return `Q${q} ${y}`;
  }
  const h = Number(m) <= 6 ? 1 : 2;
  return `H${h} ${y}`;
}

function bucketSortKey(date: string | null, mode: GroupMode): string {
  if (!date) return 'zzzz';
  const [y, m] = date.split('-');
  if (mode === 'quarter') {
    const q = Math.floor((Number(m) - 1) / 3) + 1;
    return `${y}-${q}`;
  }
  const h = Number(m) <= 6 ? 1 : 2;
  return `${y}-${h}`;
}
