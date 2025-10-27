import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
export const getDeviceType = () => {
  const aspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
  const isTablet = SCREEN_WIDTH >= 768 || SCREEN_HEIGHT >= 1024;
  const isPhone = !isTablet && (SCREEN_WIDTH < 768 || SCREEN_HEIGHT < 1024);
  const isSurface = Platform.OS === 'windows' && isTablet;
  const isIPad = Platform.OS === 'ios' && isTablet;
  const isAndroidTablet = Platform.OS === 'android' && isTablet;
  
  return {
    isPhone,
    isTablet,
    isSurface,
    isIPad,
    isAndroidTablet,
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    isWindows: Platform.OS === 'windows',
    aspectRatio,
    isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
    isPortrait: SCREEN_HEIGHT > SCREEN_WIDTH,
  };
};

// Enhanced screen size detection
export const getScreenSize = () => {
  const { isTablet, isPhone } = getDeviceType();
  
  if (isPhone) {
    if (SCREEN_WIDTH < 375) return 'small-phone';
    if (SCREEN_WIDTH < 414) return 'medium-phone';
    return 'large-phone';
  }
  
  if (isTablet) {
    if (SCREEN_WIDTH < 1024) return 'small-tablet';
    if (SCREEN_WIDTH < 1366) return 'medium-tablet';
    return 'large-tablet';
  }
  
  return 'unknown';
};

// Responsive scaling with device-specific adjustments
export const getResponsiveScale = (size: number, deviceType?: string) => {
  const device = getDeviceType();
  const screenSize = getScreenSize();
  
  let scaleFactor = 1;
  
  // Base scaling
  if (device.isPhone) {
    scaleFactor = SCREEN_WIDTH / 375; // iPhone base width
  } else if (device.isTablet) {
    scaleFactor = SCREEN_WIDTH / 768; // iPad base width
  }
  
  // Device-specific adjustments
  if (device.isIPad) {
    scaleFactor *= 1.2; // iPad text and elements should be larger
  } else if (device.isSurface) {
    scaleFactor *= 1.1; // Surface devices
  } else if (device.isAndroidTablet) {
    scaleFactor *= 1.15; // Android tablets
  }
  
  // Screen size adjustments
  switch (screenSize) {
    case 'small-phone':
      scaleFactor *= 0.9;
      break;
    case 'large-phone':
      scaleFactor *= 1.1;
      break;
    case 'small-tablet':
      scaleFactor *= 0.9;
      break;
    case 'large-tablet':
      scaleFactor *= 1.2;
      break;
  }
  
  return Math.round(size * scaleFactor);
};

// Enhanced font scaling
export const getResponsiveFontSize = (size: number, options?: {
  minSize?: number;
  maxSize?: number;
  deviceType?: string;
}) => {
  const device = getDeviceType();
  const { minSize = size * 0.8, maxSize = size * 1.5 } = options || {};
  
  let scaledSize = getResponsiveScale(size);
  
  // Platform-specific adjustments
  if (device.isIOS) {
    scaledSize *= 1.05; // iOS renders fonts slightly smaller
  } else if (device.isAndroid) {
    scaledSize *= 0.98; // Android renders fonts slightly larger
  }
  
  // Device-specific adjustments
  if (device.isIPad) {
    scaledSize *= 1.1; // iPad needs larger fonts
  } else if (device.isSurface) {
    scaledSize *= 1.05; // Surface devices
  }
  
  return Math.max(minSize, Math.min(maxSize, scaledSize));
};

// Enhanced spacing
export const getResponsiveSpacing = (size: number) => {
  const device = getDeviceType();
  let spacing = getResponsiveScale(size);
  
  // Device-specific spacing adjustments
  if (device.isTablet) {
    spacing *= 1.3; // Tablets need more spacing
  }
  
  if (device.isIPad) {
    spacing *= 1.2; // iPad specific
  } else if (device.isSurface) {
    spacing *= 1.1; // Surface specific
  }
  
  return spacing;
};

// Enhanced padding
export const getResponsivePadding = (size: number) => {
  return getResponsiveSpacing(size);
};

// Enhanced border radius
export const getResponsiveBorderRadius = (size: number) => {
  const device = getDeviceType();
  let radius = getResponsiveScale(size);
  
  // Device-specific radius adjustments
  if (device.isTablet) {
    radius *= 1.2; // Tablets can have larger radius
  }
  
  return radius;
};

// Safe area helpers for all platforms
export const getSafeAreaInsets = () => {
  const device = getDeviceType();
  
  return {
    top: device.isIOS ? (SCREEN_HEIGHT > 800 ? 44 : 20) : 24,
    bottom: device.isIOS ? (SCREEN_HEIGHT > 800 ? 34 : 0) : 0,
    left: 0,
    right: 0,
  };
};

// Responsive button dimensions
export const getResponsiveButtonSize = () => {
  const device = getDeviceType();
  const screenSize = getScreenSize();
  
  let height = 48;
  let minWidth = 120;
  
  if (device.isPhone) {
    switch (screenSize) {
      case 'small-phone':
        height = 44;
        minWidth = 100;
        break;
      case 'large-phone':
        height = 52;
        minWidth = 140;
        break;
    }
  } else if (device.isTablet) {
    height = 56;
    minWidth = 160;
    
    if (device.isIPad) {
      height = 60;
      minWidth = 180;
    } else if (device.isSurface) {
      height = 58;
      minWidth = 170;
    }
  }
  
  return { height, minWidth };
};

// Responsive icon sizes
export const getResponsiveIconSize = (baseSize: number) => {
  const device = getDeviceType();
  let size = getResponsiveScale(baseSize);
  
  if (device.isTablet) {
    size *= 1.3; // Tablets need larger icons
  }
  
  if (device.isIPad) {
    size *= 1.2; // iPad specific
  }
  
  return size;
};

// Responsive layout helpers
export const getResponsiveLayout = () => {
  const device = getDeviceType();
  const screenSize = getScreenSize();
  
  return {
    // Container padding
    containerPadding: device.isTablet ? 24 : 16,
    
    // Card spacing
    cardSpacing: device.isTablet ? 20 : 16,
    
    // Grid columns
    gridColumns: device.isTablet ? 2 : 1,
    
    // Modal dimensions
    modalWidth: device.isTablet ? Math.min(SCREEN_WIDTH * 0.8, 600) : SCREEN_WIDTH * 0.9,
    modalHeight: device.isTablet ? Math.min(SCREEN_HEIGHT * 0.8, 500) : SCREEN_HEIGHT * 0.7,
    
    // Navigation
    tabBarHeight: device.isTablet ? 80 : 70,
    
    // Header
    headerHeight: device.isTablet ? 80 : 60,
    
    // Footer
    footerHeight: device.isTablet ? 100 : 80,
  };
};

// Platform-specific color adjustments
export const getPlatformColors = () => {
  const device = getDeviceType();
  
  const baseColors = {
    primary: '#259B9A',
    background: '#1a1a1a',
    white: '#FFFFFF',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    border: '#333333',
  };
  
  // Platform-specific adjustments
  if (device.isIOS) {
    return {
      ...baseColors,
      shadow: 'rgba(0, 0, 0, 0.1)',
    };
  } else if (device.isAndroid) {
    return {
      ...baseColors,
      shadow: 'rgba(0, 0, 0, 0.3)',
    };
  } else if (device.isWindows) {
    return {
      ...baseColors,
      shadow: 'rgba(0, 0, 0, 0.2)',
    };
  }
  
  return baseColors;
};

// Responsive breakpoints
export const getBreakpoints = () => {
  return {
    phone: { min: 0, max: 767 },
    tablet: { min: 768, max: 1023 },
    desktop: { min: 1024, max: Infinity },
  };
};

// Media query helper
export const isBreakpoint = (breakpoint: 'phone' | 'tablet' | 'desktop') => {
  const breakpoints = getBreakpoints();
  const bp = breakpoints[breakpoint];
  return SCREEN_WIDTH >= bp.min && SCREEN_WIDTH <= bp.max;
};

export {
    SCREEN_HEIGHT, SCREEN_WIDTH
};





