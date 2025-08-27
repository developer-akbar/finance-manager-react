import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import Navigation from './Navigation';
import MobileBottomNav from './MobileBottomNav';
import ScrollToTop from './ScrollToTop';
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

  // Jump to top instantly on view change (no scrolling animation)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.currentView]);

  return (
    <div className="layout">
      {!isMobile && <Navigation />}
      <main className={`main-content ${!isMobile ? 'with-sidebar' : ''}`}>
        <div className="content-wrapper">
          {children}
        </div>
      </main>
      {isMobile && <MobileBottomNav />}
      <ScrollToTop />
    </div>
  );
};

export default Layout;