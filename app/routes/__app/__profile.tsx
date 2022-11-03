import type { LoaderArgs } from '@remix-run/node';
import { Outlet } from '@remix-run/react';

import { requireAuthSession } from '~/modules/auth';

export async function loader({ request }: LoaderArgs) {
  await requireAuthSession(request);
  return null;
}

function ProfileLayout() {
  return (
    <div className="w-full py-6 mx-auto sm:w-[90%] md:w-[75%] lg:w-[60%] xl:w-[50%] 2xl:w-[45%]">
      <Outlet />
    </div>
  );
}

export default ProfileLayout;
