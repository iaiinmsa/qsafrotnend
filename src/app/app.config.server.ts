import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideHttpClient } from '@angular/common/http';

const serverConfig: ApplicationConfig = {
    providers: [
        provideServerRendering(),
        provideNativeDateAdapter() ,// <--- AÑADIR ESTO
        provideHttpClient()
    ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);