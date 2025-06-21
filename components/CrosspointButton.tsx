// components/CrosspointButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/Colors'; // Assuming your colors are here
import { useColorScheme } from 'react-native';

type ButtonState = 'patched' | 'desired_inactive' | 'overpatched' | 'unpatched';

interface CrosspointButtonProps {
  state: ButtonState;
  onClick: () => void;
}

export const CrosspointButton: React.FC<CrosspointButtonProps> = ({ state, onClick }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Define colors based on the state
  const stateColors = {
    patched: theme.success, // e.g., a vibrant green
    desired_inactive: theme.warning, // e.g., an amber/yellow
    overpatched: theme.destructive, // e.g., a red
    unpatched: theme.icon, // e.g., a muted grey
  };

  const backgroundColor = stateColors[state] || theme.icon;

  return (
    <TouchableOpacity style={styles.wrapper} onPress={onClick}>
      <View style={[styles.button, { backgroundColor }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 80, // Fixed width for each grid cell
    height: 50, // Fixed height for each grid cell
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16, // Makes it a circle
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});
