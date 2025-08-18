import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const DateNavigation = ({ 
  currentDate, 
  onDateChange, 
  viewType = 'monthly',
  showQuickSelector = true,
  className = '' 
}) => {
  const [showDateSelector, setShowDateSelector] = useState(false);
  const dateSelectorRef = useRef(null);

  // Close date selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateSelectorRef.current && !dateSelectorRef.current.contains(event.target)) {
        setShowDateSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const changePeriod = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewType) {
      case 'daily':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() + direction);
        break;
      case 'financial-yearly':
        newDate.setFullYear(newDate.getFullYear() + direction);
        break;
      default:
        newDate.setMonth(newDate.getMonth() + direction);
    }
    
    onDateChange(newDate);
  };

  const handleQuickDateSelect = (year, month) => {
    let newDate;
    
    switch (viewType) {
      case 'daily':
        newDate = new Date(year, month, 1);
        break;
      case 'monthly':
        newDate = new Date(year, month, 1);
        break;
      case 'yearly':
        newDate = new Date(year, 0, 1);
        break;
      case 'financial-yearly':
        newDate = new Date(year, 3, 1); // April 1st for FY start
        break;
      default:
        newDate = new Date(year, month, 1);
    }
    
    onDateChange(newDate);
    setShowDateSelector(false);
  };

  const formatDate = (date) => {
    switch (viewType) {
      case 'daily':
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
      case 'monthly':
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
      case 'yearly':
        return date.getFullYear().toString();
      case 'financial-yearly':
        const fyStart = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
        return `FY ${fyStart}-${fyStart + 1}`;
      default:
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
    }
  };

  const getDropdownHeader = () => {
    switch (viewType) {
      case 'daily':
        return 'Select Month & Year';
      case 'monthly':
        return 'Select Month & Year';
      case 'yearly':
        return 'Select Year';
      case 'financial-yearly':
        return 'Select Financial Year';
      default:
        return 'Select Month & Year';
    }
  };

  // Generate years and months for quick selector
  const generateDateOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    
    // Add current year and a few years back
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push(year);
    }

    return years.sort((a, b) => b - a);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const availableYears = generateDateOptions();

  return (
    <div className={`date-navigation ${className}`}>
      <button onClick={() => changePeriod(-1)}>&lt;</button>
      
      {showQuickSelector ? (
        <div className="quick-date-selector" ref={dateSelectorRef}>
          <span 
            className={`period-display ${showDateSelector ? 'open' : ''}`}
            onClick={() => setShowDateSelector(!showDateSelector)}
          >
            <Calendar size={16} />
            {formatDate(currentDate)}
            <ChevronDown size={12} />
          </span>
          
          {showDateSelector && (
            <div className="date-dropdown">
              <div className="date-dropdown-header">
                {getDropdownHeader()}
              </div>
              <div className="date-dropdown-content">
                {viewType === 'yearly' || viewType === 'financial-yearly' ? (
                  // Show only years for yearly views
                  availableYears.map(year => (
                    <div
                      key={year}
                      className={`year-item ${
                        currentDate.getFullYear() === year ? 'active' : ''
                      }`}
                      onClick={() => handleQuickDateSelect(year, 0)}
                    >
                      {viewType === 'financial-yearly' ? `FY ${year}-${year + 1}` : year}
                    </div>
                  ))
                ) : (
                  // Show months and years for daily/monthly views
                  availableYears.map(year => (
                    <div key={year} className="year-section">
                      <div className="year-header">{year}</div>
                      <div className="month-list">
                        {months.map((month, index) => (
                          <div
                            key={index}
                            className={`month-item ${
                              currentDate.getFullYear() === year && 
                              currentDate.getMonth() === index ? 'active' : ''
                            }`}
                            onClick={() => handleQuickDateSelect(year, index)}
                          >
                            {month}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <span className="period-display">
          <Calendar size={16} />
          {formatDate(currentDate)}
        </span>
      )}
      
      <button onClick={() => changePeriod(1)}>&gt;</button>
    </div>
  );
};

export default DateNavigation;
