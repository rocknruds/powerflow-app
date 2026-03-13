import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

export function ActorPreview() {
  const mockActors = [
    {
      name: 'United States',
      type: 'State Actor',
      authority: 87,
      reach: 94,
      delta: +2.3,
      status: 'stable'
    },
    {
      name: 'European Union',
      type: 'Supranational',
      authority: 71,
      reach: 82,
      delta: -1.2,
      status: 'declining'
    },
    {
      name: 'Hezbollah',
      type: 'Non-State',
      authority: 64,
      reach: 43,
      delta: +5.7,
      status: 'rising'
    },
    {
      name: 'People\'s Republic of China',
      type: 'State Actor',
      authority: 89,
      reach: 88,
      delta: +3.1,
      status: 'rising'
    }
  ];

  return (
    <section id="platform" className="py-24 px-6 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 
            className="text-4xl md:text-5xl mb-4 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Actor Intelligence
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time scoring and analysis across states and non-state actors
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {mockActors.map((actor, index) => (
            <div 
              key={index}
              className="p-6 rounded-lg border border-border bg-background hover:border-accent/30 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg mb-1 group-hover:text-accent transition-colors">
                    {actor.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{actor.type}</p>
                </div>
                <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${
                  actor.delta > 0 ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#ef4444]/10 text-[#ef4444]'
                }`}>
                  {actor.delta > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>{actor.delta > 0 ? '+' : ''}{actor.delta}%</span>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Authority</span>
                    <span className="text-[#f59e0b]">{actor.authority}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#f59e0b] rounded-full transition-all"
                      style={{ width: `${actor.authority}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Reach</span>
                    <span className="text-[#f97316]">{actor.reach}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#f97316] rounded-full transition-all"
                      style={{ width: `${actor.reach}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-accent transition-colors">
                <span>View detailed analysis</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <button className="px-6 py-3 border border-border rounded-md hover:bg-secondary transition-colors text-sm">
            Explore All Actors
          </button>
        </div>
      </div>
    </section>
  );
}
