import React from 'react';

import { useTranslation } from 'react-i18next';
import { AiOutlineMail } from 'react-icons/ai';

import { useTypedFetcher } from '~/hooks/use-fetcher';
import type { action } from '~/routes/__auth/send-magic-link';

export function ContinueWithEmailForm() {
  const ref = React.useRef<HTMLFormElement>(null);
  const sendMagicLink = useTypedFetcher<typeof action>();
  const { data, state, type } = sendMagicLink;
  const isSuccessFull = type === 'done' && !data?.error;
  const isLoading = state === 'submitting' || state === 'loading';
  const { t } = useTranslation('auth');
  const buttonLabel = isLoading ? t('register.sendingLink') : t('register.continueWithEmail');

  React.useEffect(() => {
    if (isSuccessFull) {
      ref.current?.reset();
    }
  }, [isSuccessFull]);

  return (
    <sendMagicLink.Form method="post" action="/send-magic-link" replace={false} ref={ref}>
      <input type="email" name="email" id="magic-link" className="w-full input input-bordered" disabled={isLoading} />
      <div
        className={`mb-1 h-6 text-center ${data?.error ? 'text-red-600' : ''} ${isSuccessFull ? 'text-green-600' : ''}`}
      >
        {!isSuccessFull ? data?.error : t('register.checkEmail')}
      </div>
      <button type="submit" disabled={isLoading} className="w-full gap-2 btn ">
        {buttonLabel}
        <AiOutlineMail />
      </button>
    </sendMagicLink.Form>
  );
}
