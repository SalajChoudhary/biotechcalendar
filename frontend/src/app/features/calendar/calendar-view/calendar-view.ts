import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CatalystService } from '../../../core/services/catalyst.service';
import { CatalystResponse } from '../../../core/models/catalyst.model';
import { CatalystDetailDialogComponent } from '../catalyst-detail-dialog/catalyst-detail-dialog';
import { extractErrorMessage } from '../../../shared/utils/http-error';

interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  events: CatalystResponse[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './calendar-view.html',
  styleUrl: './calendar-view.css',
})
export class CalendarViewComponent implements OnInit {
  readonly dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  private readonly catalystService = inject(CatalystService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  private catalysts = signal<CatalystResponse[]>([]);
  undatedEvents = signal<CatalystResponse[]>([]);
  currentDate = signal(new Date());
  errorMessage = signal('');
  isLoading = signal(false);

  monthLabel = computed(() =>
    this.currentDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  );

  weeks = computed<CalendarDay[][]>(() => {
    const { startDate, endDate, month } = this.visibleRange();
    const catalysts = this.catalysts();

    const weeks: CalendarDay[][] = [];
    let week: CalendarDay[] = [];
    const d = new Date(startDate);

    while (d <= endDate) {
      const dateStr = this.toDateStr(d);
      week.push({
        date: new Date(d),
        dateStr,
        isCurrentMonth: d.getMonth() === month,
        events: catalysts.filter((c) => {
          const displayDate = c.expectedDateEnd ?? c.expectedDateStart;
          return displayDate !== null && displayDate === dateStr;
        }),
      });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }

      d.setDate(d.getDate() + 1);
    }

    return weeks;
  });

  ngOnInit() {
    this.loadForCurrentMonth();
    this.loadUndated();
  }

  private loadUndated() {
    this.catalystService
      .getUndatedCatalysts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalysts) => this.undatedEvents.set(catalysts),
        error: (err) => {
          this.errorMessage.set(extractErrorMessage(err, 'Failed to load undated catalysts.'));
        },
      });
  }

  prevMonth() {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() - 1);
    this.currentDate.set(d);
    this.loadForCurrentMonth();
  }

  nextMonth() {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() + 1);
    this.currentDate.set(d);
    this.loadForCurrentMonth();
  }

  goToToday() {
    this.currentDate.set(new Date());
    this.loadForCurrentMonth();
  }

  openDetail(catalyst: CatalystResponse) {
    this.dialog.open(CatalystDetailDialogComponent, {
      data: catalyst,
      width: '500px',
    });
  }

  getEventColor(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('phase 3')) return '#1565c0';
    if (t.includes('phase 2')) return '#2e7d32';
    if (t.includes('phase 1')) return '#e65100';
    if (t.includes('nda') || t.includes('bla') || t.includes('pdufa')) return '#880e4f';
    return '#6a1b9a';
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  private loadForCurrentMonth() {
    const { startDate, endDate } = this.visibleRange();
    const from = this.toDateStr(startDate);
    const to = this.toDateStr(endDate);
    this.isLoading.set(true);
    this.catalystService
      .getCatalystsInRange(from, to)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalysts) => {
          this.catalysts.set(catalysts);
          this.errorMessage.set('');
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(extractErrorMessage(err, 'Failed to load catalysts.'));
          this.isLoading.set(false);
        },
      });
  }

  private visibleRange(): { startDate: Date; endDate: Date; month: number } {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    return { startDate, endDate, month };
  }

  private toDateStr(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
