import React from 'react';

import type { LinksFunction, LoaderFunction, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { useChangeLanguage } from 'remix-i18next';

import { i18nextServer } from '~/integrations/i18n';

import { i18nCookie } from './integrations/i18n/i18nCookie';
import tailwindStylesheetUrl from './styles/tailwind.css';
import { getBrowserEnv } from './utils/env';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: tailwindStylesheetUrl }];

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Remix Notes',
  viewport: 'width=device-width,initial-scale=1',
});

export const loader: LoaderFunction = async ({ request }) => {
  const locale = await i18nextServer.getLocale(request);
  return json(
    {
      locale,
      env: getBrowserEnv(),
    },
    {
      headers: { 'Set-Cookie': await i18nCookie.serialize(locale) },
    }
  );
};

export function action() {
  // this is for useRevalidator
  return { ok: true };
}

export default function App() {
  const { env, locale } = useLoaderData<typeof loader>();
  const { i18n } = useTranslation();
  // const [theme, setTheme] = React.useState<string>(() => {
  //   // getting stored value
  // const saved = localStorage.getItem('theme');
  //   const initialValue = JSON.parse(saved as string);
  //   return initialValue || 'dark';
  // });
  useChangeLanguage(locale);

  return (
    <html data-locale={locale} lang={locale} dir={i18n.dir()} className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="relative h-full">
        <Outlet />
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.env = ${JSON.stringify(env)}`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
