import React from 'react';

import { useTranslation } from 'react-i18next';

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
      <input
        type="email"
        name="email"
        id="magic-link"
        className="w-full px-2 py-1 mb-1 text-lg border border-gray-500 rounded"
        disabled={isLoading}
      />
      <div
        className={`mb-2 h-6 text-center ${data?.error ? 'text-red-600' : ''} ${isSuccessFull ? 'text-green-600' : ''}`}
      >
        {!isSuccessFull ? data?.error : t('register.checkEmail')}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center w-full px-4 py-3 font-medium text-white bg-green-500 rounded-md hover:bg-green-600 "
      >
        {buttonLabel}
      </button>
    </sendMagicLink.Form>
  );
}
