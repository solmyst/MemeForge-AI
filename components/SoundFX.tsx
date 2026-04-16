'use client';

import { useCallback, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// Generate fun sound effects using Web Audio API (no external files needed)
function createAudioContext() {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

type SoundType = 'boom' | 'airhorn' | 'oof' | 'success' | 'dhishum' | 'emotional';

function playSound(type: SoundType) {
  try {
    const ctx = createAudioContext();
    
    switch (type) {
      case 'boom': {
        // Deep bass boom
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        break;
      }
      case 'airhorn': {
        // Ascending tones
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
        break;
      }
      case 'oof': {
        // Low thud
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        break;
      }
      case 'success': {
        // Happy ding ding
        [0, 0.15, 0.3].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime([523, 659, 784][i], ctx.currentTime + delay);
          gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.2);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.2);
        });
        break;
      }
      case 'dhishum': {
        // Punchy hit
        const noise = ctx.createBufferSource();
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }
        noise.buffer = buffer;
        const gain = ctx.createGain();
        noise.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        noise.start(ctx.currentTime);
        break;
      }
      case 'emotional': {
        // Descending sad trombone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(280, ctx.currentTime + 0.5);
        osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.9);
        break;
      }
    }

    // Clean up after sound plays
    setTimeout(() => ctx.close(), 2000);
  } catch (e) {
    console.warn('Sound FX error:', e);
  }
}

const SOUND_TYPES: SoundType[] = ['boom', 'airhorn', 'oof', 'success', 'dhishum', 'emotional'];
const _SOUND_LABELS: Record<SoundType, string> = {
  boom: '💥 Vine Boom',
  airhorn: '📯 Airhorn',
  oof: '💀 Oof',
  success: '✨ Ding!',
  dhishum: '🥊 Dhishum',
  emotional: '😭 Emotional Damage',
};

export function useSoundFX() {
  const [enabled, setEnabled] = useState(true);
  
  const playRandomSound = useCallback(() => {
    if (!enabled) return;
    const type = SOUND_TYPES[Math.floor(Math.random() * SOUND_TYPES.length)];
    playSound(type);
  }, [enabled]);

  return { enabled, setEnabled, playRandomSound };
}

export function SoundToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
        enabled
          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50'
      }`}
      title={enabled ? 'Sound FX: ON' : 'Sound FX: OFF'}
    >
      {enabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
      <span className="hidden sm:inline">{enabled ? 'FX ON' : 'FX OFF'}</span>
    </button>
  );
}
