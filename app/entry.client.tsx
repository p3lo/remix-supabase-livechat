import React from 'react';

import { CacheProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { RemixBrowser } from '@remix-run/react';
import { hydrateRoot } from 'react-dom/client';

import { I18nClientProvider, initI18nextClient } from './integrations/i18n'; // your i18n configuration file
import ClientStyleContext from './modules/mui/ClientStyleContext';
import createEmotionCache from './modules/mui/createEmotionCache';
import { dark } from './modules/mui/theme';

interface ClientCacheProviderProps {
  children: React.ReactNode;
}
function ClientCacheProvider({ children }: ClientCacheProviderProps) {
  const [cache, setCache] = React.useState(createEmotionCache());

  const clientStyleContextValue = React.useMemo(
    () => ({
      reset() {
        setCache(createEmotionCache());
      },
    }),
    []
  );

  return (
    <ClientStyleContext.Provider value={clientStyleContextValue}>
      <CacheProvider value={cache}>{children}</CacheProvider>
    </ClientStyleContext.Provider>
  );
}

function hydrate() {
  React.startTransition(() => {
    hydrateRoot(
      document,
      <React.StrictMode>
        <I18nClientProvider>
          <ClientCacheProvider>
            <ThemeProvider theme={dark}>
              <CssBaseline />
              <RemixBrowser />
            </ThemeProvider>
          </ClientCacheProvider>
        </I18nClientProvider>
      </React.StrictMode>
    );
  });
}

initI18nextClient(hydrate);
