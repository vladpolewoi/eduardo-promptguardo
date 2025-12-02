// import { injectMessenger } from './services/InjectMessenger';
import { FetchInterceptor } from './services/FetchInterceptor';

console.log('[Inject] initialized');
//
//
const CONFIG = {
  targetUrlPattern: '/conversation',
  requestTimeout: 2000,
} as const;
//
// // Start messenger (listen for responses from content script)
// // injectMessenger.start();
//
//

const interceptor = new FetchInterceptor(CONFIG);
interceptor.install();
//

