import MemeGenerator from '@/components/MemeGenerator';
import { Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-purple-500/30">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-24 space-y-12">
        
        {/* Header / Landing Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-medium text-sm mb-4">
            <Sparkles size={16} />
            <span>AI-Powered Meme Generation</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent animate-float">
            MemeForge AI
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 font-medium">
            The only local AI meme generator that understands your chaotic energy. 
            No logins. No subscriptions. Just pure, unhinged memes.
          </p>
        </div>

        {/* The Application */}
        <MemeGenerator />
        
        {/* Footer */}
        <footer className="text-center text-zinc-600 text-sm pt-12 pb-6 border-t border-zinc-900 flex flex-col items-center gap-4">
          <p>© 2026 MemeForge AI — Powered by Llama 3.1 & memegen.link</p>
          <div className="text-xs italic bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
            "We aren't responsible for your bad sense of humor."
          </div>
        </footer>
      </div>
    </main>
  );
}
