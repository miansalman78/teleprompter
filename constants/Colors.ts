/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#259B9A';
const tintColorDark = '#259B9A';

export const Colors = {
  light: {
    text: '#FFFFFF',
    background: '#161B1B',
    tint: tintColorLight,
    icon: '#FFFFFF',
    tabIconDefault: '#FFFFFF',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FFFFFF',
    background: '#161B1B',
    tint: tintColorDark,
    icon: '#FFFFFF',
    tabIconDefault: '#FFFFFF',
    tabIconSelected: tintColorDark,
  },
};

// App-specific colors
export const AppColors = {
  primary: '#259B9A',
  secondary: '#161B1B',
  white: '#FFFFFF',
  background: '#161B1B',
  cardBackground: '#259B9A',
  text: '#FFFFFF',
};
