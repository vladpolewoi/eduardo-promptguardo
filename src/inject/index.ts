import { FetchInterceptor } from './services/FetchInterceptor';

const CONFIG = {
  targetUrlPattern: '/conversation',
  requestTimeout: 2000,
} as const;

const interceptor = new FetchInterceptor(CONFIG);

interceptor.install();

