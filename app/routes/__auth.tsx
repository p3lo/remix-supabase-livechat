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
      <Outlet />
    </div>
  );
}

export default AuthLayout;
