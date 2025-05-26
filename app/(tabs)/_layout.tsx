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
          title: 'Dashboard', // Or redirect: href: '/(tabs)/sources'
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
          href: null, // Hide from tab bar if it's just a redirect target or not a primary tab
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
    </Tabs>
  );
}