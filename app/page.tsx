import MemeGenerator from '@/components/MemeGenerator';
import ParticleBackground from '@/components/ParticleBackground';
import { Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-purple-500/30">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16 space-y-10">

        {/* Hero Section */}
        <div className="relative text-center space-y-6 max-w-3xl mx-auto">
          {/* Particle Background */}
          <ParticleBackground />

          {/* Badge */}
          <div className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full glass neon-glow text-purple-400 font-medium text-sm mb-4 animate-slide-up">
            <Sparkles size={16} />
            <span>100% Local AI • Your Data Never Leaves Your Machine</span>
          </div>

          {/* Title */}
          <h1 className="relative z-10 text-5xl md:text-7xl font-extrabold tracking-tight animate-float">
            <span className="bg-gradient-to-br from-white via-purple-200 to-purple-500 bg-clip-text text-transparent">
              Meme Bhandar
            </span>
          </h1>

          {/* Subtitle */}
          <p className="relative z-10 text-base md:text-lg text-zinc-400 font-medium max-w-xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            AI-powered meme generator that doesn&apos;t generate images — it generates{' '}
            <span className="text-purple-400 font-semibold">generational trauma</span> ⚡
          </p>

          {/* Feature tags */}
          <div className="relative z-10 flex flex-wrap gap-2 justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {['🇮🇳 Desi Mode', '🏏 IPL Memes', '🎬 Bollywood', '💀 Dark Humor', '📸 Snap to Meme', '🎰 Roulette', '⚔️ Battle'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-900/80 text-zinc-400 border border-zinc-800/80"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* The Application */}
        <MemeGenerator />

        {/* Footer */}
        <footer className="text-center text-zinc-600 text-sm pt-8 pb-6 border-t border-zinc-800/50 flex flex-col items-center gap-4">
          <p>© 2026 Meme Bhandar — by{' '}
            <span className="text-zinc-500 font-medium">Gangs of Washpur</span>
          </p>
          <div className="flex items-center gap-3">
            <div className="text-xs italic glass px-3 py-1.5 rounded-full">
              We do what we do, we don&apos;t know why 🫡
            </div>
          </div>
          <div className="text-[10px] text-zinc-700 mt-2">
            Powered by Ollama • Llama 3.2 • Moondream • memegen.link
          </div>
        </footer>
      </div>
    </main>
  );
}
