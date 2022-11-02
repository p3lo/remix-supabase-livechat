import React from 'react';

import type { ActionFunction } from '@remix-run/node';
import { redirect, json } from '@remix-run/node';
import { Form } from '@remix-run/react';

import { i18nextServer } from '~/integrations/i18n';
import { getDomainUrl, getStripeSession } from '~/integrations/stripe/stripe.server';
import { getAuthSession } from '~/modules/auth';
import { PLAN_1_PRICE_ID, PLAN_2_PRICE_ID, PLAN_3_PRICE_ID } from '~/utils';

export const action: ActionFunction = async ({ request }) => {
  const session = await getAuthSession(request);
  if (!session) return json({ user: null }, { status: 401 });
  const locale = await i18nextServer.getLocale(request);
  const stripeRedirectUrl = await getStripeSession(
    PLAN_1_PRICE_ID as string,
    getDomainUrl(request),
    locale,
    session.userId
  );
  return redirect(stripeRedirectUrl);
};

function BuyTokens() {
  return (
    <Form method="post">
      <button type="submit">buy</button>
    </Form>
  );
}

export default BuyTokens;
