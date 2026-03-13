import { ArrowRight, Lock } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="p-12 rounded-lg border border-accent/20 bg-accent/5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm mb-6">
            <Lock className="w-3.5 h-3.5" />
            <span>Early Access</span>
          </div>
          
          <h2 
            className="text-4xl md:text-5xl mb-4 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Join the Intelligence
            <br />
            Revolution
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            PowerFlow is currently in private beta. Request access to start tracking geopolitical power dynamics in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <input 
              type="email"
              placeholder="Enter your email"
              className="w-full sm:w-80 px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button className="w-full sm:w-auto px-6 py-3 bg-accent text-accent-foreground rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              Request Access
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Join 500+ analysts, researchers, and strategists already on the waitlist
          </p>
        </div>
      </div>
    </section>
  );
}
