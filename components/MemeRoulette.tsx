'use client';

import { useState, useEffect } from 'react';
import { Dices, Sparkles, Loader2 } from 'lucide-react';

interface TrendingTopic {
  topic: string;
  style: string;
  id: number;
}

interface MemeRouletteProps {
  onGenerate: (topic: string, style: string) => Promise<void>;
  loading?: boolean;
}

const SLOT_EMOJIS = ['🎰', '🔥', '💀', '🧠', '🤡', '⚡', '🎯', '🇮🇳', '🏏', '😭'];

export default function MemeRoulette({ onGenerate, loading }: MemeRouletteProps) {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [allStyles, setAllStyles] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [slotEmoji, setSlotEmoji] = useState('🎰');

  useEffect(() => {
    fetch('/api/trending-topics')
      .then((r) => r.json())
      .then((data) => {
        setTrendingTopics(data.trending || []);
        setAllStyles(data.styles || []);
      })
      .catch(console.error);
  }, []);

  const handleSpin = async () => {
    if (loading || isSpinning || trendingTopics.length === 0) return;

    setIsSpinning(true);
    setSelectedTopic(null);
    setSelectedStyle(null);

    // Spin animation — cycle through emojis
    let spinCount = 0;
    const spinInterval = setInterval(() => {
      setSlotEmoji(SLOT_EMOJIS[spinCount % SLOT_EMOJIS.length]);
      spinCount++;
    }, 80);

    // After spin delay, pick random
    await new Promise((resolve) => setTimeout(resolve, 1200));
    clearInterval(spinInterval);

    const randomTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
    const randomStyle = allStyles[Math.floor(Math.random() * allStyles.length)];

    setSelectedTopic(randomTopic.topic);
    setSelectedStyle(randomStyle);
    setSlotEmoji('🎯');
    setIsSpinning(false);

    // Auto-generate the meme
    await onGenerate(randomTopic.topic, randomStyle);
  };

  return (
    <div className="glass rounded-2xl p-5 neon-glow space-y-4">
      <div className="flex items-center gap-2">
        <Dices size={18} className="text-cyan-400" />
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Meme Roulette</h3>
        <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">
          ZERO EFFORT
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Slot display */}
        <div className="flex items-center gap-3 flex-1 w-full">
          <div
            className={`w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-center text-2xl transition-all ${
              isSpinning ? 'animate-pulse border-cyan-500/50' : ''
            }`}
          >
            {isSpinning ? (
              <span className="animate-slot-spin">{slotEmoji}</span>
            ) : (
              slotEmoji
            )}
          </div>

          <div className="flex-1 min-w-0">
            {selectedTopic ? (
              <div className="animate-slide-up">
                <p className="text-sm text-zinc-200 font-medium truncate">{selectedTopic}</p>
                <p className="text-xs text-purple-400 mt-0.5">Style: {selectedStyle}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-zinc-400">Feeling lucky?</p>
                <p className="text-xs text-zinc-600">Hit spin for a random meme</p>
              </div>
            )}
          </div>
        </div>

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={loading || isSpinning || trendingTopics.length === 0}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-2 text-sm"
        >
          {isSpinning ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Spinning...
            </>
          ) : loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Forging...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Surprise Me!
            </>
          )}
        </button>
      </div>
    </div>
  );
}
