import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppColors } from '../../constants/Colors';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      {/* Top line above tab bar */}
      <View style={styles.topLine} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: AppColors.primary,
          tabBarInactiveTintColor: '#888',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: AppColors.background,
            borderTopWidth: 0,
            height: 70,
            paddingBottom: 8,
            paddingTop: 8,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  topLine: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#333',
    zIndex: 1,
  },
});