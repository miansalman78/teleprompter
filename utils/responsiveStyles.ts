import { Platform, StyleSheet } from 'react-native';
import {
    getResponsiveButtonHeight,
    getTopSafeArea,
    isLargeScreen,
    isMediumScreen,
    isSmallScreen,
    responsiveBorderRadius,
    responsiveFontSize,
    responsivePadding,
    responsiveSpacing,
    SCREEN_HEIGHT,
    SCREEN_WIDTH
} from './scaling';

// Common responsive styles that can be reused across the app
export const ResponsiveStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  
  // Header styles
  header: {
    paddingTop: getTopSafeArea() + responsiveSpacing(20),
    paddingBottom: responsiveSpacing(20),
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: responsiveFontSize(24, 28, 20),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
  headerLine: {
    width: SCREEN_WIDTH * (isSmallScreen ? 0.85 : 0.8),
    height: 1,
    backgroundColor: '#259B9A',
    marginTop: responsiveSpacing(15),
  },
  
  // Content styles
  content: {
    flex: 1,
    paddingHorizontal: responsivePadding(20),
    paddingTop: responsiveSpacing(10),
  },
  
  contentWithBottomPadding: {
    flex: 1,
    paddingHorizontal: responsivePadding(20),
    paddingTop: responsiveSpacing(10),
    paddingBottom: responsiveSpacing(90),
  },
  
  // Card styles
  card: {
    borderRadius: responsiveBorderRadius(12),
    padding: responsivePadding(20),
    marginBottom: responsiveSpacing(20),
    // Platform-specific shadows
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? 2 : 4,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 4 : 8,
    elevation: Platform.OS === 'android' ? 6 : 0,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: '#259B9A',
    borderRadius: responsiveBorderRadius(12),
    padding: responsivePadding(18),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveButtonHeight(),
    // Platform-specific shadows
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? 2 : 4,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 4 : 8,
    elevation: Platform.OS === 'android' ? 6 : 0,
  },
  
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(16, 18, 14),
    fontWeight: '600',
  },
  
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: responsiveBorderRadius(20),
    paddingHorizontal: responsivePadding(20),
    paddingVertical: responsiveSpacing(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(14, 16, 12),
    fontWeight: '600',
  },
  
  // Text styles
  titleText: {
    fontSize: responsiveFontSize(18, 20, 16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: responsiveSpacing(20),
  },
  
  bodyText: {
    fontSize: responsiveFontSize(16, 18, 14),
    color: '#FFFFFF',
    lineHeight: isSmallScreen ? 22 : 24,
  },
  
  captionText: {
    fontSize: responsiveFontSize(14, 16, 12),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  // Input styles
  textInput: {
    backgroundColor: '#259B9A',
    borderRadius: responsiveBorderRadius(12),
    padding: responsivePadding(15),
    color: '#FFFFFF',
    fontSize: responsiveFontSize(16, 18, 14),
    lineHeight: isSmallScreen ? 22 : 24,
    textAlignVertical: 'top',
    minHeight: isSmallScreen ? 240 : isLargeScreen ? 280 : 260,
  },
  
  // List styles
  listContainer: {
    paddingBottom: responsiveSpacing(20),
  },
  
  listItem: {
    backgroundColor: '#259B9A',
    borderRadius: responsiveBorderRadius(12),
    padding: responsivePadding(15),
    marginBottom: responsiveSpacing(15),
    flexDirection: 'row',
    alignItems: 'center',
    // Platform-specific shadows
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? 2 : 4,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 4 : 8,
    elevation: Platform.OS === 'android' ? 6 : 0,
  },
  
  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(18, 20, 16),
    marginTop: responsiveSpacing(20),
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: responsiveSpacing(100),
  },
  
  emptyText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(20, 22, 18),
    fontWeight: '600',
    marginTop: responsiveSpacing(20),
  },
  
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: responsiveFontSize(16, 18, 14),
    marginTop: responsiveSpacing(10),
    textAlign: 'center',
  },
});

// Platform-specific color adjustments
export const getPlatformColors = () => {
  return {
    primary: '#259B9A',
    background: '#1a1a1a',
    white: '#FFFFFF',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    shadow: Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.3)',
    border: '#333333',
  };
};

// Screen size specific adjustments
export const getScreenSpecificStyles = () => {
  return {
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    
    // Responsive dimensions
    cardMinHeight: isSmallScreen ? 180 : isLargeScreen ? 220 : 200,
    buttonMinHeight: isSmallScreen ? 44 : isLargeScreen ? 52 : 48,
    thumbnailSize: {
      width: isSmallScreen ? 70 : isLargeScreen ? 90 : 80,
      height: isSmallScreen ? 52 : isLargeScreen ? 68 : 60,
    },
  };
};
