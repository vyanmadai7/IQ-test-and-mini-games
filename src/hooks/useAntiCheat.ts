import { useEffect } from 'react';

export function useAntiCheat(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Just log or show alert to simulate anti-cheat
        console.warn("Anti-cheat: Focus lost. Potential unauthorized external assistance detected.");
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      console.warn("Anti-cheat: Clipboard restricted.");
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
    };
  }, [isActive]);
}
