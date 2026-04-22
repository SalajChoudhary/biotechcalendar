import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'calendar',
    pathMatch: 'full',
  },
  {
    path: 'calendar',
    loadComponent: () => import('./features/calendar/calendar.page').then((m) => m.CalendarPage),
  },
  {
    path: 'companies',
    loadComponent: () =>
      import('./features/companies/company-list/company-list').then((m) => m.CompanyListComponent),
  },
  {
    path: 'companies/new',
    loadComponent: () =>
      import('./features/companies/company-form/company-form').then((m) => m.CompanyFormComponent),
  },
  {
    path: 'companies/:id/edit',
    loadComponent: () =>
      import('./features/companies/company-form/company-form').then((m) => m.CompanyFormComponent),
  },
  {
    path: 'catalysts',
    loadComponent: () =>
      import('./features/catalysts/catalyst-list/catalyst-list').then(
        (m) => m.CatalystListComponent,
      ),
  },
  {
    path: 'catalysts/new',
    loadComponent: () =>
      import('./features/catalysts/catalyst-form/catalyst-form').then(
        (m) => m.CatalystFormComponent,
      ),
  },
  {
    path: 'catalysts/:id/edit',
    loadComponent: () =>
      import('./features/catalysts/catalyst-form/catalyst-form').then(
        (m) => m.CatalystFormComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'calendar',
  },
];
