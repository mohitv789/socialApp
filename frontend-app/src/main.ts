/// <reference types="@angular/localize" />

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';


// platformBrowserDynamic().bootstrapModule(AppModule)
//   .catch(err => console.error(err));

// window.onerror = function (message, source, lineno, colno, error) {
//   console.error('Global window.onerror caught:', { message, source, lineno, colno, error });
//   // show a visible alert in the browser so the page isn't just white
//   try { alert('APP BOOT ERROR: ' + (message || (error && error.message) || 'unknown')); } catch(e) {}
// };

// platformBrowserDynamic().bootstrapModule(AppModule)
//   .catch(err => {
//     console.error('Bootstrap failed', err);
//     try { alert('BOOTSTRAP ERROR: ' + (err && err.message)); } catch(e) {}
//   });


platformBrowserDynamic().bootstrapModule(AppModule)