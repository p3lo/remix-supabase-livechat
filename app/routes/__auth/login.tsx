import * as React from 'react';

import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useSearchParams, useTransition } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { AiOutlineLogin, AiOutlineGithub, AiOutlineGoogle, AiOutlineFacebook } from 'react-icons/ai';
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
    <div className="w-full max-w-md px-8 mx-auto border shadow border-gray-500/50 rounded-xl">
      <Form ref={zo.ref} method="post" className="mt-3 space-y-3" replace>
        <div>
          <label htmlFor={zo.fields.email()} className="label-text">
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
              className="w-full input input-bordered"
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
          <label htmlFor={zo.fields.password()} className="label-text">
            {t('register.password')}
          </label>
          <div className="mt-1">
            <input
              data-test-id="password"
              name={zo.fields.password()}
              type="password"
              autoComplete="new-password"
              className="w-full input input-bordered"
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
        <button data-test-id="login" type="submit" className="w-full gap-2 btn" disabled={disabled}>
          {t('login.action')}
          <AiOutlineLogin />
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
          <div className="w-full divider">{t('login.orContinueWith')}</div>
        </div>
        <div className="mt-3">
          <ContinueWithEmailForm />
        </div>
      </div>
      <div className="flex my-6 space-x-2">
        <button className="gap-2 btn h-[60px] grow" onClick={signWithGithub}>
          <AiOutlineGithub className="h-[30px] w-[30px]" />
        </button>
        <button className="gap-2 btn h-[60px] grow" onClick={signWithGithub}>
          <AiOutlineGoogle className="h-[30px] w-[30px]" />
        </button>
        <button className="gap-2 btn h-[60px] grow" onClick={signWithGithub}>
          <AiOutlineFacebook className="h-[30px] w-[30px]" />
        </button>
      </div>
    </div>
  );
}
