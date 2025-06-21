// app/(tabs)/matrices.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Api, { MatrixItem } from '../../services/Api';
import { MatrixListItem } from '../../components/MatrixListItem'; // Import the simplified list item
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function MatricesListScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const router = useRouter(); // Expo Router's navigation hook

    const [matrices, setMatrices] = useState<MatrixItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMatrices = useCallback(async () => {
        if (!refreshing) setIsLoading(true);
        setError(null);
        try {
            const response = await Api.getMatrices();
            setMatrices(response.data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch matrices.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [refreshing]);

    useEffect(() => {
        fetchMatrices();
    }, []); // Initial fetch

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMatrices();
    }, [fetchMatrices]);

    const navigateToMatrix = (id: number) => {
        // Use Expo Router to push to the dynamic route for the matrix grid view.
        router.push(`/matrix/${id}`);
    };

    // Show a loading indicator on initial fetch
    if (isLoading && matrices.length === 0) {
        return <ActivityIndicator size="large" style={styles.centered} color={theme.primary} />;
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Matrix Switcher' }} />
            
            <FlatList
                data={matrices}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <MatrixListItem
                        item={item}
                        onNavigate={() => navigateToMatrix(item.id)}
                    />
                )}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                contentContainerStyle={{ padding: 15 }}
                ListEmptyComponent={() => (
                    <View style={styles.centered}>
                        <ThemedText>No matrices found.</ThemedText>
                        {error && <ThemedText style={{ color: theme.destructive, marginTop: 10 }}>Error: {error}</ThemedText>}
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
        paddingTop: 50 
    },
});