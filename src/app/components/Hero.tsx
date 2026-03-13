import { ArrowRight, TrendingUp, Network } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          {/* Accent badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm mb-8">
            <Network className="w-3.5 h-3.5" />
            <span>Geopolitical Intelligence Platform</span>
          </div>
          
          {/* Main headline */}
          <h1 
            className="text-5xl md:text-7xl mb-6 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Track How Power
            <br />
            <span className="text-accent">Actually Moves</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Not as states declare it, but as events reveal it. PowerFlow maps authority, reach, and dependencies across actors—creating a living record of geopolitical reality.
          </p>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button className="w-full sm:w-auto px-6 py-3 bg-accent text-accent-foreground rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="w-full sm:w-auto px-6 py-3 border border-border rounded-md hover:bg-secondary transition-colors">
              View Documentation
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto pt-8 border-t border-border">
            <div>
              <div className="text-3xl font-serif mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                200+
              </div>
              <div className="text-sm text-muted-foreground">Tracked Actors</div>
            </div>
            <div>
              <div className="text-3xl font-serif mb-1 text-accent" style={{ fontFamily: "'Playfair Display', serif" }}>
                Live
              </div>
              <div className="text-sm text-muted-foreground">Real-time Updates</div>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-[#22c55e]" />
              <div className="text-3xl font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
                24/7
              </div>
              <div className="ml-2 text-sm text-muted-foreground">Intelligence</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
