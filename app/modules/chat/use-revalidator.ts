import { useCallback, useMemo } from 'react';

import { useFetcher } from '@remix-run/react';

export function useRevalidator() {
  const { submit } = useFetcher();

  const revalidate = useCallback(() => {
    submit(null, { action: '/', method: 'post' });
  }, [submit]);

  return useMemo(() => ({ revalidate }), [revalidate]);
}
