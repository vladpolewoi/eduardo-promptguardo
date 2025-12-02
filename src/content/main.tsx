import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { app } from './services/AppBootstrap';
import { EmailProvider } from './context/EmailContext.tsx';

import App from './views/App.tsx';

// Init app
app.init();

// Mount app
const container = document.createElement('div');

container.id = 'crxjs-app';
document.body.appendChild(container);

createRoot(container).render(
  <StrictMode>
    <EmailProvider>
      <App />
    </EmailProvider>
  </StrictMode>,
);

