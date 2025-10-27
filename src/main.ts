import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


console.log('MAIN TS!');
bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [
        ...(appConfig.providers || []),
        provideHttpClient(),
        BrowserAnimationsModule
    ]
}).catch((err) => console.error(err));

