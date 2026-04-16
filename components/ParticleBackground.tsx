'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  emoji: string;
  left: number;
  animDuration: number;
  animDelay: number;
  size: number;
}

const EMOJIS = ['💀', '🔥', '😭', '🤡', '💅', '🧠', '⚡', '🎯', '👀', '🇮🇳', '🏏', '🎬', '☕', '🫡', '💥'];

export default function ParticleBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated: Particle[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      left: Math.random() * 100,
      animDuration: 8 + Math.random() * 16,
      animDelay: Math.random() * 12,
      size: 14 + Math.random() * 14,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            bottom: '-40px',
            fontSize: `${p.size}px`,
            animationDuration: `${p.animDuration}s`,
            animationDelay: `${p.animDelay}s`,
            opacity: 0,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
