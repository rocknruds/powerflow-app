import { Activity, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  setIsDark: (value: boolean) => void;
}

export function Header({ isDark, setIsDark }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
            <Activity className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="font-serif text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            PowerFlow
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#platform" className="text-muted-foreground hover:text-foreground transition-colors">
            Platform
          </a>
        </nav>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-9 h-9 rounded-md bg-secondary hover:bg-muted transition-colors flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-foreground" />
            )}
          </button>
          
          <button className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:opacity-90 transition-opacity text-sm">
            Request Access
          </button>
        </div>
      </div>
    </header>
  );
}
