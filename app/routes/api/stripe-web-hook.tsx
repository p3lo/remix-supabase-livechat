import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import Stripe from 'stripe';

const STRIPE_SECRET_API_KEY = process.env.STRIPE_SECRET_API_KEY;

const WEBHOOK_ENDPOINT_SECRET =
  process.env.NODE_ENV === 'development'
    ? process.env.DEV_STRIPE_WEBHOOK_ENDPOINT_SECRET
    : process.env.PROD_STRIPE_WEBHOOK_ENDPOINT_SECRET;

const stripe = new Stripe(STRIPE_SECRET_API_KEY, {
  apiVersion: '2022-08-01',
});
//[credit @kiliman to get this webhook working](https://github.com/remix-run/remix/discussions/1978)
export const action: ActionFunction = async ({ request }) => {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    if (typeof signature === 'string') {
      // Constructs and verifies the signature of an Event.
      event = stripe.webhooks.constructEvent(payload, signature, WEBHOOK_ENDPOINT_SECRET);
    }
  } catch (err) {
    console.log(err);
    return json({}, { status: 500 });
  }
  console.log('event', event);
  return new Response(null, { status: 200 });
};
