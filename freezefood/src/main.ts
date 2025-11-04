import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import logger from './app/utils/logger';

// Use the ESM build of Bootstrap to avoid CommonJS/AMD optimization bailouts
// (preferred for Angular builds)
import 'bootstrap/dist/js/bootstrap.esm.min.js';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => logger.error(err));

