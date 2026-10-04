import { useEffect, useState } from 'react';
/** Keep interactive controls unavailable until their event handlers are attached. */
export function useClientReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
