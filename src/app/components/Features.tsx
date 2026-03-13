import { Activity, GitBranch, TrendingUp, Zap } from 'lucide-react';

const features = [
  {
    icon: Activity,
    title: 'Authority & Reach Scoring',
    description: 'Every actor is scored on two dimensions: Authority (internal control) and Reach (external influence). Scores update as events unfold.',
    color: '#f59e0b'
  },
  {
    icon: GitBranch,
    title: 'Dependency Mapping',
    description: 'Understand how power flows through relationships. See which actors depend on others and how disturbances cascade through the system.',
    color: '#3b82f6'
  },
  {
    icon: TrendingUp,
    title: 'Score Trajectories',
    description: 'Track how influence shifts over time. Visualize the rise and fall of actors through historical score analysis.',
    color: '#22c55e'
  },
  {
    icon: Zap,
    title: 'AI-Powered Intelligence',
    description: 'Agents continuously ingest intelligence, update scores, and surface reasoning from a private Notion knowledge graph.',
    color: '#f97316'
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 
            className="text-4xl md:text-5xl mb-4 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Intelligence That Adapts
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A living record of geopolitical reality, not just another static dashboard
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-8 rounded-lg border border-border bg-background hover:border-accent/30 transition-all group"
            >
              <div 
                className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${feature.color}20` }}
              >
                <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <h3 className="text-xl mb-3 group-hover:text-accent transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
