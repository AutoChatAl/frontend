import { useCallback, useEffect, useRef, useState } from 'react';

interface UseInstagramOAuthPopupOptions {
    getOAuthUrl: () => Promise<string>;
    onFinished: () => void;
    onError: (message: string) => void;
}

interface UseInstagramOAuthPopupReturn {
    connecting: boolean;
    start: () => Promise<void>;
}

const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 700;
const POPUP_NAME = 'instagram-oauth';

function openBlankPopup(): Window | null {
  const left = window.screen.width / 2 - POPUP_WIDTH / 2;
  const top = window.screen.height / 2 - POPUP_HEIGHT / 2;
  return window.open('', POPUP_NAME, `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`);
}

export function useInstagramOAuthPopup({ getOAuthUrl, onFinished, onError }: UseInstagramOAuthPopupOptions): UseInstagramOAuthPopupReturn {
  const [connecting, setConnecting] = useState(false);
  const watcherRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbacksRef = useRef({ getOAuthUrl, onFinished, onError });

  useEffect(() => {
    callbacksRef.current = { getOAuthUrl, onFinished, onError };
  });

  useEffect(() => () => {
    if (watcherRef.current) {
      clearInterval(watcherRef.current);
    }
  }, []);

  const start = useCallback(async () => {
    const popup = openBlankPopup();
    setConnecting(true);
    try {
      const url = await callbacksRef.current.getOAuthUrl();
      if (!popup || popup.closed) {
        window.location.href = url;
        return;
      }
      popup.location.href = url;
      if (watcherRef.current) {
        clearInterval(watcherRef.current);
      }
      watcherRef.current = setInterval(() => {
        if (!popup.closed) {
          return;
        }
        if (watcherRef.current) {
          clearInterval(watcherRef.current);
          watcherRef.current = null;
        }
        setConnecting(false);
        callbacksRef.current.onFinished();
      }, 500);
    }
    catch (error) {
      popup?.close();
      setConnecting(false);
      callbacksRef.current.onError(error instanceof Error ? error.message : 'Não foi possível abrir o login do Instagram. Tente de novo.');
    }
  }, []);

  return { connecting, start };
}
