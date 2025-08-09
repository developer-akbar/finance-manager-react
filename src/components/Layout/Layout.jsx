import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import Navigation from './Navigation';
import MobileBottomNav from './MobileBottomNav';
import ScrollToTop from './ScrollToTop';
import ThemeToggle from './ThemeToggle';
import './Layout.css';

const Layout = ({ children }) => {
  const { state } = useApp();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="layout">
      {!isMobile && <Navigation />}
      <main className={`main-content ${!isMobile ? 'with-sidebar' : ''}`}>
        <div className="content-wrapper">
          <div className="content-header">
            <ThemeToggle />
          </div>
          {children}
        </div>
      </main>
      {isMobile && <MobileBottomNav />}
      <ScrollToTop />
    </div>
  );
};

export default Layout;