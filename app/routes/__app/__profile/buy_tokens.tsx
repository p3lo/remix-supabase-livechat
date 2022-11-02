import React from 'react';

import { RadioGroup } from '@headlessui/react';
import type { ActionFunction } from '@remix-run/node';
import { redirect, json } from '@remix-run/node';
import { Form } from '@remix-run/react';

import { i18nextServer } from '~/integrations/i18n';
import { getDomainUrl, getStripeSession } from '~/integrations/stripe/stripe.server';
import { getAuthSession } from '~/modules/auth';
import { PLAN_1_PRICE_ID, PLAN_2_PRICE_ID, PLAN_3_PRICE_ID } from '~/utils';

const plans = [
  {
    plan: '10 tokens',
    price: '10 EUR',
  },
  {
    plan: '25 tokens',
    price: '20 EUR',
  },
  {
    plan: '70 tokens',
    price: '50 EUR',
  },
];

export const action: ActionFunction = async ({ request }) => {
  const data = await request.formData();
  const plan = data.get('plan') as string;
  const session = await getAuthSession(request);
  if (!session || !plan) return json({ user: null }, { status: 401 });
  const locale = await i18nextServer.getLocale(request);
  let priceId = PLAN_1_PRICE_ID;
  if (plan.startsWith('25')) {
    priceId = PLAN_2_PRICE_ID;
  } else if (plan.startsWith('70')) {
    priceId = PLAN_3_PRICE_ID;
  }
  const stripeRedirectUrl = await getStripeSession(
    priceId as string,
    getDomainUrl(request),
    locale,
    session.userId,
    plan.split(' ')[0]
  );
  return redirect(stripeRedirectUrl);
};

function BuyTokens() {
  const [selected, setSelected] = React.useState(plans[0]);
  return (
    <div className="flex flex-col items-center justify-center w-full space-y-3">
      <h1 className="text-2xl font-bold">Buy tokens</h1>
      <div className="w-full max-w-md py-10 mx-auto">
        <RadioGroup value={selected} onChange={setSelected}>
          <RadioGroup.Label className="sr-only">Choose prefered option</RadioGroup.Label>
          <div className="space-y-2">
            {plans.map((plan) => (
              <RadioGroup.Option
                key={plan.plan}
                value={plan}
                className={({ active, checked }) =>
                  `${active ? 'ring-2 ring-white ring-opacity-60 ring-offset-2 ring-offset-sky-300' : ''}
                  ${checked ? 'bg-sky-700 bg-opacity-75 text-white' : 'bg-base-200 text-white'}
                    relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none`
                }
              >
                {({ active, checked }) => (
                  <>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <div className="text-sm">
                          <RadioGroup.Label
                            as="p"
                            className={`font-medium  ${checked ? 'text-white' : 'text-gray-400'}`}
                          >
                            {plan.plan}
                          </RadioGroup.Label>
                          <RadioGroup.Description
                            as="span"
                            className={`inline ${checked ? 'text-sky-100' : 'text-gray-500'}`}
                          >
                            <span>{plan.price}</span>{' '}
                            {/* <span aria-hidden="true">&middot;</span> <span>{plan.disk}</span> */}
                          </RadioGroup.Description>
                        </div>
                      </div>
                      {checked && (
                        <div className="text-white shrink-0">
                          <CheckIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
      </div>
      <Form method="post">
        <input hidden readOnly name="plan" value={selected.plan} />
        <button className="btn w-[150px]" type="submit">
          Buy
        </button>
      </Form>
    </div>
  );
}

function CheckIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx={12} cy={12} r={12} fill="#fff" opacity="0.2" />
      <path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default BuyTokens;
