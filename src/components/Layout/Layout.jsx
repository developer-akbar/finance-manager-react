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

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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