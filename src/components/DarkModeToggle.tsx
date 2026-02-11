import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetting } from '@/hooks/useSettings';

export function DarkModeToggle() {
  const { data: savedTheme } = useSetting('theme_colors');
  const [isDark, setIsDark] = useState(false);

  const darkModeEnabled = savedTheme && typeof savedTheme === 'object' && (savedTheme as Record<string, unknown>).darkModeEnabled === true;

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored === 'true') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  if (!darkModeEnabled) return null;

  return (
    <Button variant="ghost" size="icon" onClick={toggle} className="h-9 w-9" aria-label="Växla dark mode">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
