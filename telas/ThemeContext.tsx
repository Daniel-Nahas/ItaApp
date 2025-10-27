// telas/ThemeContext.tsx (cirando tema diferenciado)
import React, { createContext, useState, useContext } from 'react';
import { appStyles } from './Style';
import { accessibleStyles } from './StyleAccessible';

type ThemeContextType = {
  styles: any;
  toggleTheme: () => void;
  isAccessible: boolean;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAccessible, setIsAccessible] = useState(false);

  const toggleTheme = () => setIsAccessible(prev => !prev);

  return (
    <ThemeContext.Provider
      value={{
        styles: isAccessible ? accessibleStyles : appStyles,
        toggleTheme,
        isAccessible,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};