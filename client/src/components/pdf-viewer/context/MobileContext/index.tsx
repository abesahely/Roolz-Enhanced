import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Breakpoints
const MOBILE_BREAKPOINT = 640;  // sm in Tailwind
const TABLET_BREAKPOINT = 768;  // md in Tailwind

// Context interface
interface MobileContextState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// Create the context
const MobileContext = createContext<MobileContextState | undefined>(undefined);

// Provider component
interface MobileProviderProps {
  children: ReactNode;
}

export const MobileProvider: React.FC<MobileProviderProps> = ({ children }) => {
  // State to track device sizes
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Effect to handle resize and set device status
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      setIsMobile(width < MOBILE_BREAKPOINT);
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT);
      setIsDesktop(width >= TABLET_BREAKPOINT);
    };

    // Check on mount
    checkDeviceType();

    // Add event listener for resize
    window.addEventListener('resize', checkDeviceType);

    // Clean up
    return () => {
      window.removeEventListener('resize', checkDeviceType);
    };
  }, []);

  // Value for the context
  const value: MobileContextState = {
    isMobile,
    isTablet,
    isDesktop
  };

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
};

// Custom hook
export const useMobileContext = () => {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error('useMobileContext must be used within a MobileProvider');
  }
  return context;
};

export default MobileContext;