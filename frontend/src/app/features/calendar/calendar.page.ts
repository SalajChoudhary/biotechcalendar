import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';

import { CompanyFormComponent } from '../companies/company-form/company-form';
import { CompanyListComponent } from '../companies/company-list/company-list';
import { CatalystFormComponent } from '../catalysts/catalyst-form/catalyst-form';
import { CatalystListComponent } from '../catalysts/catalyst-list/catalyst-list';
import { CalendarViewComponent } from './calendar-view/calendar-view';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatTabsModule,
    CompanyFormComponent,
    CompanyListComponent,
    CatalystFormComponent,
    CatalystListComponent,
    CalendarViewComponent,
  ],
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.css',
})
export class CalendarPage {}
