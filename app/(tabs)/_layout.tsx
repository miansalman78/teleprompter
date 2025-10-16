import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../constants/Colors';
import {
    getResponsiveTabBarHeight,
    responsiveFontSize
} from '../../utils/scaling';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  // Calculate tab bar height including safe area
  const tabBarHeight = getResponsiveTabBarHeight() + insets.bottom;
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top line above tab bar */}
      <View style={[styles.topLine, { bottom: tabBarHeight }]} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: AppColors.primary,
          tabBarInactiveTintColor: '#888',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: AppColors.background,
            borderTopWidth: 0,
            height: tabBarHeight,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            paddingTop: 8,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: Platform.OS === 'ios' ? -2 : 4,
            },
            shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.3,
            shadowRadius: Platform.OS === 'ios' ? 4 : 8,
            elevation: Platform.OS === 'android' ? 8 : 0,
          },
          tabBarLabelStyle: {
            fontSize: responsiveFontSize(11, 13, 10),
            fontWeight: '500',
          },
        }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="script"
        options={{
          title: 'Script',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="description" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'My Videos',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="videocam" size={size || 24} color={color} />
          ),
        }}
      />
    </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  topLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#333',
    zIndex: 1,
  },
});