import React from 'react';

import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { db } from '~/database';
import { requireAuthSession } from '~/modules/auth';

export async function loader({ request }: LoaderArgs) {
  const session = await requireAuthSession(request);
  invariant(session, 'Session is required');
  const getOrders = await db.orders.findMany({
    where: {
      userId: session.userId,
    },
  });
  return json({ orders: getOrders });
}

function OrdersHistory() {
  const { orders } = useLoaderData<typeof loader>();

  function getDate(date: string) {
    const created = new Date(date);
    const day = created.getDate();
    const month = created.getMonth();
    const year = created.getFullYear();
    return month + 1 + '/' + day + '/' + year;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full py-10 space-y-3">
      <h1 className="text-2xl font-bold">Orders History</h1>
      <div className="overflow-x-auto">
        <table className="table w-full table-zebra">
          <thead>
            <tr>
              <th>Order</th>
              <th>Tokens</th>
              <th>Price</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.credits}</td>
                <td>{order.price} EUR</td>
                <td>{getDate(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrdersHistory;
