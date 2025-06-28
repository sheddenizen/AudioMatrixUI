// app/(tabs)/index.tsx
import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
// Import useFocusEffect from expo-router
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Api, { MatrixItem } from '../../services/Api';
import { MatrixListItem } from '../../components/MatrixListItem';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function MatricesListScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const router = useRouter();

    const [matrices, setMatrices] = useState<MatrixItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- The Fix: Use useFocusEffect with a stable callback ---
    // This hook runs the effect every time the screen comes into focus.
    useFocusEffect(
      useCallback(() => {
        // This function is the "effect" that will run.
        const fetchOnFocus = async () => {
          // We can show a loading spinner, but only if not already loading
          // to prevent flashes on quick re-focus.
          if (!isLoading) {
            setIsLoading(true);
          }
          setError(null);

          try {
            const response = await Api.getMatrices();
            setMatrices(response.data || []);
          } catch (err: any) {
            setError(err.message || 'Failed to fetch matrices.');
            setMatrices([]); // Clear data on error to avoid showing stale data
          } finally {
            setIsLoading(false);
          }
        };

        fetchOnFocus();

      }, []) // <-- THE KEY: An empty dependency array makes this callback stable.
             // It will be created only once and will not change on re-renders,
             // which breaks the infinite loop.
    );

    const navigateToMatrix = (id: number) => {
        router.push(`/matrix/${id}`);
    };

    // Show a loading indicator
    if (isLoading) {
        return <ActivityIndicator size="large" style={styles.centered} color={theme.primary} />;
    }

    // Show an error message if something went wrong
    if (error) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText style={{ color: theme.destructive }}>Error: {error}</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Select a Matrix' }} />
            
            <FlatList
                data={matrices}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <MatrixListItem
                        item={item}
                        onNavigate={() => navigateToMatrix(item.id)}
                    />
                )}
                // We don't need pull-to-refresh because focusing the tab does the same job now.
                contentContainerStyle={{ padding: 15 }}
                ListEmptyComponent={() => (
                    <View style={styles.centered}>
                        <ThemedText>No matrices found.</ThemedText>
                    </View>
                )}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1 
    },
    centered: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 20,
    },
});