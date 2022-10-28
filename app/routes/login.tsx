import * as React from 'react';

import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useSearchParams, useTransition } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { parseFormAny, useZorm } from 'react-zorm';
import { z } from 'zod';

import { i18nextServer } from '~/integrations/i18n';
import { createAuthSession, getAuthSession, signInWithEmail, ContinueWithEmailForm } from '~/modules/auth';
import { signWithGithub } from '~/modules/auth/service.client';
import { assertIsPost, isFormProcessing } from '~/utils';

export async function loader({ request }: LoaderArgs) {
  const authSession = await getAuthSession(request);
  const t = await i18nextServer.getFixedT(request, 'auth');
  const title = t('login.title');

  if (authSession) return redirect('/notes');

  return json({ title });
}

const LoginFormSchema = z.object({
  email: z
    .string()
    .email('invalid-email')
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8, 'password-too-short'),
  redirectTo: z.string().optional(),
});

export async function action({ request }: ActionArgs) {
  assertIsPost(request);
  const formData = await request.formData();
  const result = await LoginFormSchema.safeParseAsync(parseFormAny(formData));

  if (!result.success) {
    return json(
      {
        errors: result.error,
      },
      { status: 400 }
    );
  }

  const { email, password, redirectTo } = result.data;

  const authSession = await signInWithEmail(email, password);

  if (!authSession) {
    return json({ errors: { email: 'invalid-email-password', password: null } }, { status: 400 });
  }

  return createAuthSession({
    request,
    authSession,
    redirectTo: redirectTo || '/notes',
  });
}

export const meta: MetaFunction = ({ data }) => ({
  title: data.title,
});

export default function LoginPage() {
  const zo = useZorm('NewQuestionWizardScreen', LoginFormSchema);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? undefined;

  const transition = useTransition();
  const disabled = isFormProcessing(transition.state);
  const { t } = useTranslation('auth');

  return (
    <div className="flex flex-col justify-center min-h-full">
      <div className="w-full max-w-md px-8 mx-auto">
        <Form ref={zo.ref} method="post" className="space-y-6" replace>
          <div>
            <label htmlFor={zo.fields.email()} className="block text-sm font-medium text-gray-700">
              {t('login.email')}
            </label>

            <div className="mt-1">
              <input
                data-test-id="email"
                required
                autoFocus={true}
                name={zo.fields.email()}
                type="email"
                autoComplete="email"
                className="w-full px-2 py-1 text-lg border border-gray-500 rounded"
                disabled={disabled}
              />
              {zo.errors.email()?.message && (
                <div className="pt-1 text-red-700" id="email-error">
                  {zo.errors.email()?.message}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor={zo.fields.password()} className="block text-sm font-medium text-gray-700">
              {t('register.password')}
            </label>
            <div className="mt-1">
              <input
                data-test-id="password"
                name={zo.fields.password()}
                type="password"
                autoComplete="new-password"
                className="w-full px-2 py-1 text-lg border border-gray-500 rounded"
                disabled={disabled}
              />
              {zo.errors.password()?.message && (
                <div className="pt-1 text-red-700" id="password-error">
                  {zo.errors.password()?.message}
                </div>
              )}
            </div>
          </div>

          <input type="hidden" name={zo.fields.redirectTo()} value={redirectTo} />
          <button
            data-test-id="login"
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-500 rounded focus:bg-blue-400 hover:bg-blue-600"
            disabled={disabled}
          >
            {t('login.action')}
          </button>
          <div className="flex items-center justify-center">
            <div className="text-sm text-center text-gray-500">
              {t('login.dontHaveAccount')}{' '}
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: '/join',
                  search: searchParams.toString(),
                }}
              >
                {t('login.signUp')}
              </Link>
            </div>
          </div>
        </Form>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-500 bg-white">{t('login.orContinueWith')}</span>
            </div>
          </div>
          <div className="mt-6">
            <ContinueWithEmailForm />
          </div>
        </div>
        <div className="mt-6">
          <button
            className="w-full px-4 py-2 text-white bg-blue-500 rounded focus:bg-blue-400 hover:bg-blue-600"
            onClick={signWithGithub}
          >
            {t('login.github')}
          </button>
        </div>
      </div>
    </div>
  );
}
