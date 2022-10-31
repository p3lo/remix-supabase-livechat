import React from 'react';

import { useLocalStorage } from '@mantine/hooks';
import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, Link, Outlet, useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { AiOutlineLogout, AiOutlineSetting, AiOutlineUser } from 'react-icons/ai';

import { db } from '~/database';
import { getAuthSession } from '~/modules/auth';

export async function loader({ request }: LoaderArgs) {
  const session = await getAuthSession(request);
  if (!session) return json({ user: null }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.userId } });
  return json({ user });
}

function MainApp() {
  const { user } = useLoaderData<typeof loader>();
  const { t } = useTranslation('auth');

  const [colorScheme, setColorScheme] = useLocalStorage({
    key: 'color-scheme',
    defaultValue: 'dark',
  });
  const toggleColorScheme = () => setColorScheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return (
    <div data-theme={colorScheme} className="relative min-h-screen">
      <div className="sticky top-0 z-50 flex space-x-2 border-b border-gray-500 navbar bg-base-200/80">
        <div className="justify-start flex-none">
          <Link to="/" className="text-xl font-bold normal-case">
            LiveChat
          </Link>
        </div>
        <div className="flex justify-center space-x-2 grow">
          <Link to="/" className="normal-case">
            MenuItem1
          </Link>
          <div className="divider divider-horizontal" />
          <Link to="/" className="normal-case">
            MenuItem2
          </Link>
          <div className="divider divider-horizontal" />
          <Link to="/" className="normal-case">
            MenuItem3
          </Link>
        </div>
        <div className="flex justify-end flex-none space-x-2">
          {user ? (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder">
                <div className="w-10 rounded-full bg-neutral-focus text-neutral-content">
                  <span>{user.nickname.charAt(0)}</span>
                </div>
              </label>
              <ul
                tabIndex={0}
                className="p-2 mt-3 shadow menu menu-compact dropdown-content bg-base-200 rounded-box w-52"
              >
                <label className="mx-auto my-1 text-sm">Welcome {user.nickname}</label>
                <div className="my-0 divider" />
                <li>
                  <Link to="/profile">
                    <AiOutlineUser />
                    Profile
                  </Link>
                </li>
                <li>
                  <Link to="/settings">
                    <AiOutlineSetting />
                    Settings
                  </Link>
                </li>
                <div className="my-0 divider" />
                <li>
                  <Form action="/logout" method="post">
                    <button data-test-id="logout" type="submit" className="flex items-center gap-2 text-red-600">
                      <AiOutlineLogout />
                      {t('logout.action')}
                    </button>
                  </Form>
                </li>
              </ul>
            </div>
          ) : (
            <>
              <Link to="/join" className="normal-case btn w-[100px] btn-sm">
                Register
              </Link>
              <Link to="/login" className="normal-case btn w-[100px] btn-outline btn-sm">
                Login
              </Link>
            </>
          )}

          <label className="swap swap-rotate">
            <input
              type="checkbox"
              className="invisible"
              checked={colorScheme === 'light'}
              onChange={toggleColorScheme}
            />
            <svg className="w-6 h-6 fill-current swap-on" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
            </svg>
            <svg className="w-6 h-6 fill-current swap-off" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            </svg>
          </label>
        </div>
      </div>

      <Outlet />
    </div>
  );
}

export default MainApp;
