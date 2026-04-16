'use client';

import { useState, useEffect } from 'react';
import { Swords, Trophy, Loader2, Zap } from 'lucide-react';
import { MemeTemplate, getRandomTemplate } from '@/services/memegen';
import { buildMemeURL } from '@/utils/memeUrlBuilder';

interface MemeBattleProps {
  templates: MemeTemplate[];
  onSoundFX?: () => void;
}

interface BattleConfig {
  modelA: string;
  modelB: string;
}

interface BattleMeme {
  url: string;
  top: string;
  bottom: string;
  style: string;
  template: MemeTemplate;
  votes: number;
}

const BATTLE_STYLES = [
  { value: 'GenZ', label: '🧠 GenZ', color: 'purple' },
  { value: 'Dark Humor', label: '💀 Dark', color: 'red' },
  { value: 'Sarcastic', label: '🙄 Sarcastic', color: 'yellow' },
  { value: 'Desi Brainrot', label: '☕ Desi', color: 'orange' },
  { value: 'Bollywood Roast', label: '🎬 Bollywood', color: 'pink' },
  { value: 'IPL Mode', label: '🏏 IPL', color: 'blue' },
];

export default function MemeBattle({ templates, onSoundFX }: MemeBattleProps) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [memeA, setMemeA] = useState<BattleMeme | null>(null);
  const [memeB, setMemeB] = useState<BattleMeme | null>(null);
  const [voted, setVoted] = useState<'A' | 'B' | null>(null);
  const [totalBattles, setTotalBattles] = useState(0);
  const [config, setConfig] = useState<BattleConfig | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('memeBattleCount');
    if (saved) setTotalBattles(parseInt(saved));

    // Fetch model names
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Config load error:', err));
  }, []);

  const generateCaption = async (topicStr: string, style: string, model?: string) => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        topic: topicStr, 
        humorStyle: style,
        model: model 
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate');
    return data;
  };

  const handleBattle = async () => {
    if (!topic || templates.length === 0 || loading) return;
    setLoading(true);
    setVoted(null);
    setMemeA(null);
    setMemeB(null);

    try {
      // Pick 2 random different styles
      const shuffled = [...BATTLE_STYLES].sort(() => Math.random() - 0.5);
      const styleA = shuffled[0];
      const styleB = shuffled[1];

      // Generate both sequentially with different models if available
      const captionA = await generateCaption(topic, styleA.value, config?.modelA);
      const captionB = await generateCaption(topic, styleB.value, config?.modelB);

      const templateA = getRandomTemplate(templates);
      const templateB = getRandomTemplate(templates);

      setMemeA({
        url: buildMemeURL(templateA.id, captionA.topText, captionA.bottomText),
        top: captionA.topText,
        bottom: captionA.bottomText,
        style: styleA.label,
        template: templateA,
        votes: 0,
      });

      setMemeB({
        url: buildMemeURL(templateB.id, captionB.topText, captionB.bottomText),
        top: captionB.topText,
        bottom: captionB.bottomText,
        style: styleB.label,
        template: templateB,
        votes: 0,
      });

      onSoundFX?.();
    } catch (error) {
      console.error('Battle error:', error);
      alert('Battle failed! Make sure Ollama is running.');
    } finally {
      setLoading(false);
    }
  };


  const handleVote = (side: 'A' | 'B') => {
    if (voted) return;
    setVoted(side);
    const newCount = totalBattles + 1;
    setTotalBattles(newCount);
    localStorage.setItem('memeBattleCount', newCount.toString());
    onSoundFX?.();
  };

  return (
    <div className="glass rounded-2xl p-5 neon-glow space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords size={18} className="text-pink-400" />
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Meme Battle</h3>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-pink-500/20 text-pink-400 rounded-full border border-pink-500/30">
            A vs B
          </span>
        </div>
        {totalBattles > 0 && (
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Trophy size={12} />
            {totalBattles} battles
          </div>
        )}
      </div>

      {/* Battle Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter battle topic... e.g. Monday mornings"
          className="flex-1 px-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-pink-500/50 transition-all outline-none text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleBattle()}
        />
        <button
          onClick={handleBattle}
          disabled={loading || !topic || templates.length === 0}
          className="px-5 py-3 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-pink-500/25 flex items-center gap-2 text-sm whitespace-nowrap"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          {loading ? 'Fighting...' : 'Battle!'}
        </button>
      </div>

      {/* Battle Arena */}
      {(memeA || memeB || loading) && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
          {/* Meme A */}
          <div
            className={`rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
              voted === 'A'
                ? 'border-green-400 shadow-lg shadow-green-500/20'
                : voted === 'B'
                ? 'border-zinc-700 opacity-60'
                : 'border-zinc-800 hover:border-purple-500/50'
            }`}
            onClick={() => handleVote('A')}
          >
            {loading ? (
              <div className="aspect-square bg-zinc-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-400" size={24} />
              </div>
            ) : memeA ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={memeA.url} alt="Meme A" className="w-full aspect-square object-contain bg-zinc-950" />
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <div className="px-2 py-0.5 text-[10px] font-bold bg-black/60 text-white rounded-full w-fit">
                    {memeA.style}
                  </div>
                </div>
                {voted === 'A' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                    <Trophy size={40} className="text-green-400 animate-bounce-in" />
                  </div>
                )}
              </div>
            ) : null}
            {!loading && memeA && !voted && (
              <div className="p-2 bg-zinc-900 text-center">
                <span className="text-xs text-zinc-400">👆 This one hits harder</span>
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className="flex md:flex-col items-center justify-center gap-2 py-2">
            <div className="w-8 h-[1px] md:w-[1px] md:h-8 bg-zinc-700" />
            <span className="text-xl font-black text-pink-400 battle-vs">VS</span>
            <div className="w-8 h-[1px] md:w-[1px] md:h-8 bg-zinc-700" />
          </div>

          {/* Meme B */}
          <div
            className={`rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
              voted === 'B'
                ? 'border-green-400 shadow-lg shadow-green-500/20'
                : voted === 'A'
                ? 'border-zinc-700 opacity-60'
                : 'border-zinc-800 hover:border-purple-500/50'
            }`}
            onClick={() => handleVote('B')}
          >
            {loading ? (
              <div className="aspect-square bg-zinc-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-400" size={24} />
              </div>
            ) : memeB ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={memeB.url} alt="Meme B" className="w-full aspect-square object-contain bg-zinc-950" />
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                  <div className="px-2 py-0.5 text-[10px] font-bold bg-black/60 text-white rounded-full w-fit">
                    {memeB.style}
                  </div>
                </div>
                {voted === 'B' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                    <Trophy size={40} className="text-green-400 animate-bounce-in" />
                  </div>
                )}
              </div>
            ) : null}
            {!loading && memeB && !voted && (
              <div className="p-2 bg-zinc-900 text-center">
                <span className="text-xs text-zinc-400">👆 This one hits harder</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
