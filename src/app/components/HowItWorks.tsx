import { Database, Brain, LineChart, Globe } from 'lucide-react';

const steps = [
  {
    icon: Database,
    number: '01',
    title: 'Continuous Ingestion',
    description: 'Intelligence agents monitor events, analyze developments, and extract signals from a private Notion knowledge graph.'
  },
  {
    icon: Brain,
    title: 'Dynamic Scoring',
    number: '02',
    description: 'Every event updates Authority and Reach scores. The system tracks not just what happened, but how it shifts power dynamics.'
  },
  {
    icon: LineChart,
    number: '03',
    title: 'Cascade Analysis',
    description: 'Dependencies are traced. When one actor shifts, the system maps how disturbances propagate through connected nodes.'
  },
  {
    icon: Globe,
    number: '04',
    title: 'Public Interface',
    description: 'A Next.js app translates analysis into actor profiles, score trajectories, and conflict tracking—designed for clarity, not clutter.'
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 
            className="text-4xl md:text-5xl mb-4 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            From Events to Insight
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A systematic approach to understanding how power actually operates
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-border" 
                     style={{ transform: 'translateX(-50%)' }} 
                />
              )}
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                  <step.icon className="w-7 h-7 text-accent" />
                </div>
                <div className="text-5xl font-serif opacity-20 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {step.number}
                </div>
                <h3 className="text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
