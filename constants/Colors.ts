/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';
const action = '#02f';
const danger = '#f20';
const change = '#af4';
const donothing = '#333'

export type ThemeColors = Object;

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    createButton: action,
    cancelButton: donothing,
    danger: danger,
    change: change,
    primary: '#f0f', // Slop alert
    destructive: danger,
    border: '#888',
    inputBackground: '#ccc'
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    createButton: action,
    cancelButton: donothing,
    danger: danger,
    change: change,
    primary: '#f0f', // Slop alert
    destructive: '#990',
    border: '#888',
    inputBackground: '#222'
  },
};
