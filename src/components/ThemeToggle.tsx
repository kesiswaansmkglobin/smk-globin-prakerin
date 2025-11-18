import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="hover:bg-secondary/50 transition-all duration-300"
      title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-primary animate-fade-in" />
      ) : (
        <Moon className="h-5 w-5 text-primary animate-fade-in" />
      )}
    </Button>
  );
};

export default ThemeToggle;
