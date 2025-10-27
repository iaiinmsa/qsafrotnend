import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';
import { provideHttpClient } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


const bootstrap = () =>
    bootstrapApplication(AppComponent, {
      ...config,
      providers: [
        ...(config.providers || []),
        provideHttpClient(),
        BrowserAnimationsModule
      ]
    });
  
  export default bootstrap;
  