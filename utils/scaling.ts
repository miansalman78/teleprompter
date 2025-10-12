import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Enhanced scaling functions with platform-specific adjustments
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// Platform-specific scaling adjustments
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

// Responsive font scaling
const responsiveFontSize = (size: number, maxSize?: number, minSize?: number) => {
  const scaledSize = moderateScale(size, 0.3);
  const finalSize = Math.max(minSize || size * 0.8, Math.min(maxSize || size * 1.5, scaledSize));
  
  // Platform-specific adjustments
  if (isIOS) {
    return finalSize * 1.05; // iOS tends to render fonts slightly smaller
  } else if (isAndroid) {
    return finalSize * 0.98; // Android renders fonts slightly larger
  }
  
  return finalSize;
};

// Responsive spacing
const responsiveSpacing = (size: number) => {
  const baseSpacing = moderateScale(size, 0.4);
  
  // Adjust for different screen densities
  if (SCREEN_WIDTH < 375) {
    return baseSpacing * 0.9; // Smaller screens
  } else if (SCREEN_WIDTH > 414) {
    return baseSpacing * 1.1; // Larger screens
  }
  
  return baseSpacing;
};

// Responsive padding/margin
const responsivePadding = (size: number) => {
  return responsiveSpacing(size);
};

// Responsive border radius
const responsiveBorderRadius = (size: number) => {
  return moderateScale(size, 0.6);
};

// Screen size helpers
const isSmallScreen = SCREEN_WIDTH < 375;
const isMediumScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
const isLargeScreen = SCREEN_WIDTH >= 414;

// Safe area helpers for different platforms
const getTopSafeArea = () => {
  if (isIOS) {
    return SCREEN_HEIGHT > 800 ? 44 : 20; // iPhone X+ vs older iPhones
  }
  return 24; // Android status bar height
};

const getBottomSafeArea = () => {
  if (isIOS) {
    return SCREEN_HEIGHT > 800 ? 34 : 0; // iPhone X+ vs older iPhones
  }
  return 0; // Android navigation bar handled by system
};

// Responsive button height
const getResponsiveButtonHeight = () => {
  if (isSmallScreen) return 44;
  if (isLargeScreen) return 52;
  return 48;
};

// Responsive tab bar height
const getResponsiveTabBarHeight = () => {
  if (isIOS) {
    return SCREEN_HEIGHT > 800 ? 85 : 70; // iPhone X+ vs older
  }
  return 70; // Android
};

export {
    getBottomSafeArea,
    getResponsiveButtonHeight,
    getResponsiveTabBarHeight, getTopSafeArea, isLargeScreen, isMediumScreen, isSmallScreen, moderateScale, responsiveBorderRadius, responsiveFontSize, responsivePadding, responsiveSpacing, scale, SCREEN_HEIGHT, SCREEN_WIDTH, verticalScale
};

