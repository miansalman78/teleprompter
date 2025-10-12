import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
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

// Test component to verify responsive design implementation
export const ResponsiveTestComponent = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Responsive Design Test</Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Screen Information</Text>
        <Text style={styles.infoText}>Width: {SCREEN_WIDTH}px</Text>
        <Text style={styles.infoText}>Height: {SCREEN_HEIGHT}px</Text>
        <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
        <Text style={styles.infoText}>
          Screen Size: {
            isSmallScreen ? 'Small' : 
            isMediumScreen ? 'Medium' : 
            isLargeScreen ? 'Large' : 'Unknown'
          }
        </Text>
      </View>
      
      <View style={styles.buttonCard}>
        <Text style={styles.buttonTitle}>Button Test</Text>
        <View style={styles.testButton}>
          <Text style={styles.testButtonText}>Responsive Button</Text>
        </View>
      </View>
      
      <View style={styles.textCard}>
        <Text style={styles.textTitle}>Typography Test</Text>
        <Text style={styles.largeText}>Large Text (24px)</Text>
        <Text style={styles.mediumText}>Medium Text (16px)</Text>
        <Text style={styles.smallText}>Small Text (12px)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: responsivePadding(20),
  },
  title: {
    fontSize: responsiveFontSize(28, 32, 24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: responsiveSpacing(30),
    marginTop: responsiveSpacing(50),
  },
  infoCard: {
    backgroundColor: '#259B9A',
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
  infoTitle: {
    fontSize: responsiveFontSize(18, 20, 16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: responsiveSpacing(15),
  },
  infoText: {
    fontSize: responsiveFontSize(14, 16, 12),
    color: '#FFFFFF',
    marginBottom: responsiveSpacing(5),
    opacity: 0.9,
  },
  buttonCard: {
    backgroundColor: '#259B9A',
    borderRadius: responsiveBorderRadius(12),
    padding: responsivePadding(20),
    marginBottom: responsiveSpacing(20),
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
  buttonTitle: {
    fontSize: responsiveFontSize(18, 20, 16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: responsiveSpacing(15),
  },
  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: responsiveBorderRadius(25),
    paddingHorizontal: responsivePadding(30),
    paddingVertical: responsiveSpacing(15),
    minWidth: isSmallScreen ? 200 : isLargeScreen ? 250 : 220,
  },
  testButtonText: {
    fontSize: responsiveFontSize(16, 18, 14),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  textCard: {
    backgroundColor: '#259B9A',
    borderRadius: responsiveBorderRadius(12),
    padding: responsivePadding(20),
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
  textTitle: {
    fontSize: responsiveFontSize(18, 20, 16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: responsiveSpacing(15),
  },
  largeText: {
    fontSize: responsiveFontSize(24, 28, 20),
    color: '#FFFFFF',
    marginBottom: responsiveSpacing(10),
    fontWeight: '500',
  },
  mediumText: {
    fontSize: responsiveFontSize(16, 18, 14),
    color: '#FFFFFF',
    marginBottom: responsiveSpacing(10),
    fontWeight: '500',
  },
  smallText: {
    fontSize: responsiveFontSize(12, 14, 10),
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '500',
  },
});

export default ResponsiveTestComponent;
