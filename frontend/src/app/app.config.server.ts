import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes, withAppShell } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { AppShell } from './shell/app-shell/app-shell';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes), withAppShell(AppShell))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
