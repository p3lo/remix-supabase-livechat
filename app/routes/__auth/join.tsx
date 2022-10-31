import * as React from 'react';

import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { redirect, json } from '@remix-run/node';
import { Form, Link, useSearchParams, useTransition } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { AiOutlineGithub, AiOutlineGoogle, AiOutlineFacebook } from 'react-icons/ai';
import { parseFormAny, useZorm } from 'react-zorm';
import { z } from 'zod';

import { i18nextServer } from '~/integrations/i18n';
import { createAuthSession, getAuthSession, ContinueWithEmailForm } from '~/modules/auth';
import { signWithGithub } from '~/modules/auth/service.client';
import { getUserByEmail, createUserAccount } from '~/modules/user';
import { assertIsPost, isFormProcessing } from '~/utils';

export async function loader({ request }: LoaderArgs) {
  const authSession = await getAuthSession(request);
  const t = await i18nextServer.getFixedT(request, 'auth');
  const title = t('register.title');

  if (authSession) return redirect('/');

  return json({ title });
}

const JoinFormSchema = z.object({
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
  const result = await JoinFormSchema.safeParseAsync(parseFormAny(formData));

  if (!result.success) {
    return json(
      {
        errors: result.error,
      },
      { status: 400 }
    );
  }

  const { email, password, redirectTo } = result.data;

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return json({ errors: { email: 'user-already-exist', password: null } }, { status: 400 });
  }

  const authSession = await createUserAccount(email, password);

  if (!authSession) {
    return json({ errors: { email: 'unable-to-create-account', password: null } }, { status: 500 });
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

export default function Join() {
  const zo = useZorm('NewQuestionWizardScreen', JoinFormSchema);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? undefined;
  const transition = useTransition();
  const disabled = isFormProcessing(transition.state);
  const { t } = useTranslation('auth');

  return (
    <>
      <Form ref={zo.ref} method="post" className="mt-3 space-y-3" replace>
        <div>
          <label htmlFor={zo.fields.email()} className="label-text">
            {t('register.email')}
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
        <button data-test-id="create-account" type="submit" className="w-full gap-2 btn" disabled={disabled}>
          {t('register.action')}
        </button>
        <div className="flex items-center justify-center">
          <div className="text-sm text-center text-gray-500">
            {t('register.alreadyHaveAnAccount')}{' '}
            <Link
              className="text-blue-500 underline"
              to={{
                pathname: '/login',
                search: searchParams.toString(),
              }}
            >
              {t('register.login')}
            </Link>
          </div>
        </div>
      </Form>
      <div className="mt-6">
        <div className="relative">
          <div className="w-full divider">{t('register.orContinueWith')}</div>
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
    </>
  );
}
