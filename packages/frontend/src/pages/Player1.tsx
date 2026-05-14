import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize, Minimize } from 'lucide-react';

// Star Lantern sample text
const STAR_LANTERN_TEXT = `Once upon a time, in a quiet village nestled between rolling hills, a little girl named Mei gazed up at the night sky. She dreamed of touching the stars. One evening, her grandmother gifted her a beautiful lantern shaped like a star. "This lantern," her grandmother whispered, "holds a piece of the night sky."

Mei lit the lantern and watched as its golden glow danced across her room. Suddenly, the lantern floated from her hands, pulling her gently into the sky. Mei soared above the rooftops, past the clouds, and into a world where stars sang lullabies and comets painted trails of light.

She met a friendly star who guided her through constellations and shared stories of the universe. As dawn approached, the star led Mei back home. She awoke in her bed, the lantern by her side, its light softly fading. From that night on, whenever Mei wished for adventure, she only had to light her star lantern and dream.`;

const SCENE_IMAGE_URL =
  'https://zxhbmvyyqyjjbijzdbzy.supabase.co/storage/v1/object/public/story-references/scenes/1778157367142-0.png';

interface VoiceOption {
  name: string;
  voice: SpeechSynthesisVoice;
}

const Player1: React.FC = () => {
  const [playing, setPlaying] = useState<boolean>(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [quality, setQuality] = useState<'Hi' | 'Med' | 'Low'>('Hi');
  const [progress, setProgress] = useState<number>(0);
  const [bookmark, setBookmark] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [elapsed, setElapsed] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const [text, setText] = useState<string>(STAR_LANTERN_TEXT);

  // Load voices
  useEffect(() => {
    const populateVoices = () => {
      const synthVoices = window.speechSynthesis.getVoices();
      const options: VoiceOption[] = synthVoices.map((v) => ({ name: v.name, voice: v }));
      setVoices(options);
      if (!selectedVoice && options.length > 0) {
        setSelectedVoice(options[0]);
      }
    };
    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
    // eslint-disable-next-line
  }, []);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Play/pause logic
  useEffect(() => {
    if (playing) {
      speakFrom(currentCharIndex);
    } else {
      window.speechSynthesis.cancel();
    }
    // eslint-disable-next-line
  }, [playing, selectedVoice, speed, quality, text]);

  // Progress bar update
  useEffect(() => {
    if (!playing) return;
    let raf: number;
    const update = () => {
      if (startTimeRef.current !== null && duration > 0) {
        setElapsed(Math.min(duration, (Date.now() - startTimeRef.current) / 1000));
      }
      raf = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [playing, duration]);

  function speakFrom(charIndex: number) {
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(text.slice(charIndex));
    utter.rate = speed;
    if (selectedVoice) utter.voice = selectedVoice.voice;
    utter.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === 'word') {
        const idx = charIndex + event.charIndex;
        setCurrentCharIndex(idx);
        setProgress((idx / text.length) * 100);
      }
    };
    utter.onstart = () => {
      startTimeRef.current = Date.now() - (elapsed * 1000);
    };
    utter.onend = () => {
      setPlaying(false);
      setProgress(100);
      setElapsed(duration);
      setCurrentCharIndex(text.length);
    };
    utter.onerror = () => {
      setPlaying(false);
    };
    utteranceRef.current = utter;
    // Estimate duration (roughly, 13 chars/sec at rate=1)
    const est = (text.length - charIndex) / (13 * speed);
    setDuration(est);
    window.speechSynthesis.speak(utter);
  }

  const handlePlayPause = () => {
    if (playing) {
      setPlaying(false);
      window.speechSynthesis.pause();
    } else {
      setPlaying(true);
      window.speechSynthesis.resume();
    }
  };

  const handleSkip = (dir: 'back' | 'forward') => {
    let idx = currentCharIndex;
    if (dir === 'back') {
      idx = Math.max(0, idx - 60);
    } else {
      idx = Math.min(text.length, idx + 60);
    }
    setCurrentCharIndex(idx);
    setProgress((idx / text.length) * 100);
    setElapsed((duration * idx) / text.length);
    if (playing) speakFrom(idx);
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = voices.find((v) => v.name === e.target.value);
    if (v) setSelectedVoice(v);
  };

  const handleSpeedChange = (s: number) => {
    setSpeed(s);
  };

  const handleQuality = (q: 'Hi' | 'Med' | 'Low') => {
    setQuality(q);
  };

  const handleBookmark = () => {
    setBookmark((b) => !b);
  };

  const handleSettings = () => {
    setShowSettings((s) => !s);
  };

  // Format time mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = async () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8FF] to-[#F4F3F9] flex items-center justify-center p-6">
      <div ref={containerRef} className="w-full h-screen max-w-full relative">
        {/* Cinematic artwork with overlay controls - enlarged */}
        <div className="relative rounded-none overflow-hidden shadow-2xl h-full flex items-end bg-black/10">
          <img
            src={SCENE_IMAGE_URL}
            alt="scene"
            className="absolute inset-0 w-full h-full object-cover z-0"
            draggable={false}
          />
          {/* Overlay gradient for cinematic effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />

          {/* Controls overlay - simplified */}
          <div className="relative z-20 w-full p-10 flex flex-col justify-end h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePlayPause}
                  className="w-20 h-20 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white shadow-lg flex items-center justify-center text-3xl"
                  aria-label={playing ? 'Pause' : 'Play'}
                >
                  {playing ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10" />}
                </button>

                <button onClick={() => handleSkip('back')} className="p-4 rounded-lg bg-black/30 text-white">
                  <SkipBack className="w-7 h-7" />
                </button>
                <button onClick={() => handleSkip('forward')} className="p-4 rounded-lg bg-black/30 text-white">
                  <SkipForward className="w-7 h-7" />
                </button>

                <div className="ml-6 flex items-center gap-2">
                  <span className="text-white/90">Speed</span>
                  {[0.75, 1, 1.25, 1.5].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={`px-3 py-1 rounded-md border text-sm ${speed === s ? 'bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white' : 'bg-white text-black'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={toggleFullscreen} className="p-3 rounded-md bg-black/30 text-white">
                  {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full flex flex-col gap-1">
              <div className="w-full bg-gray-200/60 h-4 rounded-full overflow-hidden">
                <div
                  style={{ width: `${progress}%` }}
                  className="h-4 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] transition-all duration-200"
                />
              </div>
              <div className="flex justify-between text-xs text-white/80 mt-2">
                <span>{formatTime(elapsed)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Player1;
