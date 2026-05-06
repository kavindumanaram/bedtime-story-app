import { useState, useRef } from "react";

export type AmbientTrack = { id: string; label: string };

export const AMBIENT_TRACKS: AmbientTrack[] = [
  { id: "lullaby", label: "Lullaby Music" },
  { id: "rain",    label: "Gentle Rain" },
  { id: "forest",  label: "Forest Night" },
];

// Create AudioContext on first use (respects browser autoplay policy)
function makeAudioContext(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    return Ctor ? new Ctor() : null;
  } catch {
    return null;
  }
}

// Looping noise buffer — white for rain, brown (integrated white) for forest
function createNoiseSource(ctx: AudioContext, brown: boolean): AudioBufferSourceNode {
  const len = ctx.sampleRate * 5;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  if (brown) {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * w) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
  } else {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

// Pentatonic lullaby — schedule one sine-wave note at a time, returns a stop callback
function startLullaby(ctx: AudioContext, dest: AudioNode): () => void {
  const NOTES = [261.63, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66, 261.63]; // C E G A G E D C
  const NOTE_SECS = 1.5;
  let idx = 0;
  let alive = true;

  const scheduleNext = () => {
    if (!alive) return;
    const now = ctx.currentTime;
    const freq = NOTES[idx++ % NOTES.length];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.12);       // soft attack
    gain.gain.setValueAtTime(0.07, now + NOTE_SECS * 0.6);
    gain.gain.linearRampToValueAtTime(0, now + NOTE_SECS);     // release
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + NOTE_SECS + 0.05);

    setTimeout(scheduleNext, NOTE_SECS * 1000 * 0.82);
  };

  scheduleNext();
  return () => { alive = false; };
}

export function useAmbientAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrackState] = useState<AmbientTrack>(AMBIENT_TRACKS[0]);

  const ctxRef        = useRef<AudioContext | null>(null);
  const masterRef     = useRef<GainNode | null>(null);
  const noiseRef      = useRef<AudioBufferSourceNode | null>(null);
  const stopLullaby   = useRef<(() => void) | null>(null);
  const isPlayingRef  = useRef(false);
  const trackRef      = useRef<AmbientTrack>(AMBIENT_TRACKS[0]);

  const teardown = () => {
    stopLullaby.current?.();
    stopLullaby.current = null;
    try { noiseRef.current?.stop(); } catch { /* already stopped */ }
    noiseRef.current = null;
    masterRef.current?.disconnect();
    masterRef.current = null;
  };

  const startTrack = (track: AmbientTrack) => {
    if (!ctxRef.current) {
      ctxRef.current = makeAudioContext();
    }
    const ctx = ctxRef.current;
    if (!ctx) return;                                   // AudioContext unsupported
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    teardown();

    const master = ctx.createGain();
    master.connect(ctx.destination);
    masterRef.current = master;

    if (track.id === "rain") {
      master.gain.value = 0.38;
      const noise = createNoiseSource(ctx, false);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 700;
      filter.Q.value = 0.5;
      noise.connect(filter);
      filter.connect(master);
      noise.start();
      noiseRef.current = noise;

    } else if (track.id === "forest") {
      master.gain.value = 0.45;
      const noise = createNoiseSource(ctx, true);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 380;
      filter.Q.value = 0.3;
      noise.connect(filter);
      filter.connect(master);
      noise.start();
      noiseRef.current = noise;

    } else {
      // lullaby — higher master gain because oscillators are already quiet
      master.gain.value = 0.9;
      stopLullaby.current = startLullaby(ctx, master);
    }
  };

  const toggle = () => {
    if (isPlayingRef.current) {
      teardown();
      ctxRef.current?.suspend().catch(() => {});
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      startTrack(trackRef.current);
      isPlayingRef.current = true;
      setIsPlaying(true);
    }
  };

  const setTrack = (track: AmbientTrack) => {
    trackRef.current = track;
    setCurrentTrackState(track);
    if (isPlayingRef.current) startTrack(track);
  };

  return { isPlaying, currentTrack, toggle, setTrack, tracks: AMBIENT_TRACKS };
}
