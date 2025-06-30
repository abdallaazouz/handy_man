import { useState, useEffect } from 'react';
import { ReactNode } from 'react';
import Sidebar from './sidebar';
import Topbar from './topbar';
import Footer from './footer';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
      
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300",
        isCollapsed ? "lg:ml-16" : "lg:ml-72"
      )}>
        <Topbar onSidebarToggle={handleToggle} isCollapsed={isCollapsed} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 h-full">
            {children}
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
