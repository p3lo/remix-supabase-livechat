import { PassThrough } from 'stream';

import { CacheProvider } from '@emotion/react';
import createEmotionServer from '@emotion/server/create-instance';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { Response } from '@remix-run/node';
import type { EntryContext, Headers } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import isbot from 'isbot';
// import { renderToPipeableStream } from 'react-dom/server';
import { renderToString } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';

import { createI18nextServerInstance } from './integrations/i18n';
import createEmotionCache from './modules/mui/createEmotionCache';
import { dark } from './modules/mui/theme';

const ABORT_DELAY = 5000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);
  const instance = await createI18nextServerInstance(request, remixContext);

  function MuiRemixServer() {
    return (
      <I18nextProvider i18n={instance}>
        <CacheProvider value={cache}>
          <ThemeProvider theme={dark}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            <RemixServer context={remixContext} url={request.url} />
          </ThemeProvider>
        </CacheProvider>
      </I18nextProvider>
    );
  }

  // Render the component to a string.
  const html = renderToString(<MuiRemixServer />);

  // Grab the CSS from emotion
  const { styles } = extractCriticalToChunks(html);

  let stylesHTML = '';

  styles.forEach(({ key, ids, css }) => {
    const emotionKey = `${key} ${ids.join(' ')}`;
    const newStyleTag = `<style data-emotion="${emotionKey}">${css}</style>`;
    stylesHTML = `${stylesHTML}${newStyleTag}`;
  });

  // Add the Emotion style tags after the insertion point meta tag
  const markup = html.replace(
    /<meta(\s)*name="emotion-insertion-point"(\s)*content="emotion-insertion-point"(\s)*\/>/,
    `<meta name="emotion-insertion-point" content="emotion-insertion-point"/>${stylesHTML}`
  );

  responseHeaders.set('Content-Type', 'text/html');

  return new Response(`<!DOCTYPE html>${markup}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
