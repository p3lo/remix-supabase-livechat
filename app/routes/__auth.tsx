import React from 'react';

import { useLocalStorage } from '@mantine/hooks';
import { Outlet } from '@remix-run/react';

function AuthLayout() {
  const [colorScheme] = useLocalStorage({
    key: 'color-scheme',
    defaultValue: 'dark',
  });
  return (
    <div data-theme={colorScheme} className="flex flex-col justify-center min-h-full">
      <div
        className={`w-full max-w-sm px-5 mx-auto border shadow-sm ${
          colorScheme === 'dark' ? 'shadow-slate-300' : 'shadow-gray-700'
        } border-gray-500/50 rounded-xl`}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
