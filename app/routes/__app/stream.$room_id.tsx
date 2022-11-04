import React from 'react';

import { useNavigate } from '@remix-run/react';

function StreamerPage() {
  const router = useNavigate();
  React.useEffect(() => {
    router('', { replace: true });
  }, []);
  return <div>stream.$room_id</div>;
}

export default StreamerPage;
