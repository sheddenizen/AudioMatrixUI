// app/(tabs)/_layout.tsx
import React from 'react';
//import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
// import Colors from '@/constants/Colors'; // If you have a Colors constant file

// function useColorScheme() {
//   // Implement or import your color scheme hook
//   return 'light'; // Placeholder
// }

export default function TabLayout() {
  // const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true, // Or false if you want to manage headers per screen
      }}>
      <Tabs.Screen
        name="index" // Optional: could be a dashboard or redirect
        options={{
          title: 'Matrices', // Or redirect: href: '/(tabs)/sources'
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="grid" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sources" // Corresponds to app/(tabs)/sources.tsx
        options={{
          title: 'Sources',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="microphone" color={color} />,
        }}
      />
      <Tabs.Screen
        name="destinations" // Corresponds to app/(tabs)/destinations.tsx
        options={{
          title: 'Destinations',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="speaker" color={color} />,
        }}
      />
      <Tabs.Screen
        name="matrixeditor" // Corresponds to app/(tabs)/matrices.tsx
        options={{
          title: 'Matrix Editor',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="view-grid-plus-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}