import React, { useEffect, useRef, useState } from 'react';

interface StoryReaderProps {
  paragraphs: string[];
  pages?: string[];
}

const DEFAULT_PAGES = [
  'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
  'https://images.pexels.com/photos/35389652/pexels-photo-35389652.jpeg',
  'https://images.pexels.com/photos/1435075/pexels-photo-1435075.jpeg'
];

const StoryReader: React.FC<StoryReaderProps> = ({ paragraphs, pages }) => {
  const [index, setIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAutoReading, setIsAutoReading] = useState(false);

  const total = Math.max(paragraphs.length, pages ? pages.length : DEFAULT_PAGES.length);
  const img = (pages && pages[index]) || DEFAULT_PAGES[index % DEFAULT_PAGES.length];
  const text = paragraphs[index] || '';

  const hasPrev = index > 0;
  const hasNext = index < total - 1;

  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFull = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFull);
    return () => document.removeEventListener('fullscreenchange', onFull);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) await (containerRef.current as any).requestFullscreen();
      else await document.exitFullscreen();
    } catch (e) {
      /* ignore */
    }
  };

  // Speak current text
  const speakCurrent = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis not supported in this browser.');
      return;
    }
    stopSpeech();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1.0;
    utter.lang = 'en-US';
    utter.onend = () => {
      setIsPlayingAudio(false);
      // if auto reading is on, advance after speech ends
      if (isAutoReading && hasNext) {
        setIndex((i) => Math.min(total - 1, i + 1));
      }
    };
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsPlayingAudio(true);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utterRef.current = null;
    setIsPlayingAudio(false);
  };

  // Auto-advance pages
  const startAuto = () => {
    if (intervalRef.current) return;
    setIsAutoReading(true);
    intervalRef.current = window.setInterval(() => {
      setIndex((i) => {
        const next = Math.min(total - 1, i + 1);
        if (next === i) {
          stopAuto();
        }
        return next;
      });
    }, 4500);
  };

  const stopAuto = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAutoReading(false);
  };

  // If audio is playing and page changes, speak new page
  useEffect(() => {
    if (isPlayingAudio) {
      speakCurrent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
      stopAuto();
      // exit fullscreen if still active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}>
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: 520, borderRadius: 14, overflow: 'hidden' }}>
        <img
          src={img}
          alt={`page-${index + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.75)' }}
        />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.6))',
              padding: '18px 22px',
              borderRadius: 12,
              maxWidth: '86%'
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 30,
                lineHeight: 1.3,
                color: '#fff',
                fontWeight: 800,
                textAlign: 'center',
                textShadow: '0 6px 18px rgba(0,0,0,0.5)'
              }}
            >
              {text}
            </p>
          </div>
        </div>

        {/* Small icon controls inside the image */}
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isPlayingAudio) stopSpeech();
              else speakCurrent();
            }}
            title={isPlayingAudio ? 'Stop audio' : 'Play audio'}
            aria-label="Play audio"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              border: 'none',
              background: isPlayingAudio ? '#d32f2f' : 'rgba(255,255,255,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
            }}
          >
            {isPlayingAudio ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="5" width="4" height="14" fill="#fff" />
                <rect x="14" y="5" width="4" height="14" fill="#fff" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3L19 12L5 21V3Z" fill="#1976d2" />
              </svg>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isAutoReading) stopAuto();
              else startAuto();
            }}
            title={isAutoReading ? 'Stop reading' : 'Start reading'}
            aria-label="Start reading"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              border: 'none',
              background: isAutoReading ? '#f57c00' : 'rgba(255,255,255,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
            }}
          >
            {isAutoReading ? (
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 7L17 12L7 17V7Z" fill="#fff" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12H4c0-4.42 3.58-8 8-8V2z" fill="#388e3c" />
                <path d="M12 22c5.52 0 10-4.48 10-10h-2c0 4.42-3.58 8-8 8v2z" fill="#388e3c" />
              </svg>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label="Toggle fullscreen"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              border: 'none',
              background: 'rgba(255,255,255,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
            }}
          >
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6H10V4H4V10H6V6ZM14 4V6H18V10H20V4H14ZM18 18H14V20H20V14H18V18ZM10 18V14H6V20H12V18H10Z" fill="#1976d2" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3H9V5H5V9H3V3ZM21 3V9H19V5H15V3H21ZM3 15H5V19H9V21H3V15ZM15 21H21V15H19V19H15V21Z" fill="#1976d2" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Navigation row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
        <button
          onClick={() => {
            stopSpeech();
            setIndex((i) => Math.max(0, i - 1));
          }}
          disabled={!hasPrev}
          style={{
            background: hasPrev ? '#ff8a65' : '#ffe0da',
            color: hasPrev ? '#fff' : '#aa7b6b',
            border: 'none',
            borderRadius: 10,
            padding: '12px 18px',
            fontWeight: 700,
            fontSize: 16,
            cursor: hasPrev ? 'pointer' : 'not-allowed'
          }}
        >
          ← Previous
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 10,
                  background: i === index ? '#1976d2' : '#e0e0e0',
                  display: 'inline-block'
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>
            Page {index + 1} of {total}
          </div>
        </div>

        <button
          onClick={() => {
            stopSpeech();
            setIndex((i) => Math.min(total - 1, i + 1));
          }}
          disabled={!hasNext}
          style={{
            background: hasNext ? '#66bb6a' : '#e6f4ea',
            color: hasNext ? '#fff' : '#95b69b',
            border: 'none',
            borderRadius: 10,
            padding: '12px 18px',
            fontWeight: 700,
            fontSize: 16,
            cursor: hasNext ? 'pointer' : 'not-allowed'
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default StoryReader;
