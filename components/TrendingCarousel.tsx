'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { MemeTemplate } from '@/services/memegen';

interface TrendingCarouselProps {
  templates: MemeTemplate[];
  onSelect: (template: MemeTemplate) => void;
  loading?: boolean;
}

export default function TrendingCarousel({ templates, onSelect, loading }: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (templates.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-orange-400" />
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Hot Templates</h3>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">
            TRENDING
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {templates.slice(0, 20).map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            disabled={loading}
            className="group flex-shrink-0 w-[130px] rounded-xl overflow-hidden border border-zinc-800/80 hover:border-purple-500/50 transition-all hover-lift disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-900/50"
          >
            <div className="relative aspect-square overflow-hidden bg-zinc-950">
              <img
                src={template.blank}
                alt={template.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 inset-x-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                  TAP TO USE →
                </span>
              </div>
            </div>
            <div className="px-2 py-2">
              <p className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 truncate transition-colors">
                {template.name}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
