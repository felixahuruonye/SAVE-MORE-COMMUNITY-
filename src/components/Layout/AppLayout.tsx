import React from 'react';
import Navigation from './Navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        {children}
      </main>
      <Navigation />
    </div>
  );
};

export default AppLayout;