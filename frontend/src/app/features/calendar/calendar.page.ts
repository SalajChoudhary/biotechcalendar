import { Component } from '@angular/core';

import { CalendarViewComponent } from './calendar-view/calendar-view';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CalendarViewComponent],
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.css',
})
export class CalendarPage {}
