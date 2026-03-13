import { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { ActorPreview } from './components/ActorPreview';
import { CTA } from './components/CTA';
import { Header } from './components/Header';

export default function App() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Subtle grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02]" 
           style={{
             backgroundImage: `linear-gradient(${isDark ? '#3b82f6' : '#6b6b68'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? '#3b82f6' : '#6b6b68'} 1px, transparent 1px)`,
             backgroundSize: '32px 32px'
           }} 
      />
      
      <Header isDark={isDark} setIsDark={setIsDark} />
      <Hero />
      <Features />
      <HowItWorks />
      <ActorPreview />
      <CTA />
      
      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2026 PowerFlow. Geopolitical intelligence platform.</p>
        </div>
      </footer>
    </div>
  );
}
