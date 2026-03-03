import { useState, useCallback, useRef } from 'react';

interface UseTTSReturn {
  speak: (text: string) => void;
  stop: () => void;
  isPlaying: boolean;
  isSupported: boolean;
}

export function useTTS(): UseTTSReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback((text: string) => {
    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlaying(false);

    const encoded = encodeURIComponent(text);
    const url = `/api/tts?q=${encoded}`;

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);

    audio.play().catch(() => setIsPlaying(false));
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Google Translate TTS works in all modern browsers
  return { speak, stop, isPlaying, isSupported: true };
}
