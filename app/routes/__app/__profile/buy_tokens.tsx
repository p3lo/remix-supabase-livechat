import React from 'react';

import type { ActionFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { Form } from '@remix-run/react';

import { getDomainUrl, getStripeSession } from '~/integrations/stripe/stripe.server';
import { PLAN_1_PRICE_ID, PLAN_2_PRICE_ID, PLAN_3_PRICE_ID } from '~/utils';

export const action: ActionFunction = async ({ request }) => {
  const stripeRedirectUrl = await getStripeSession(PLAN_1_PRICE_ID as string, getDomainUrl(request));
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
