// app/matrix/[id].tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { MatrixView } from '@/components/MatrixView';
import { ThemedText } from '@/components/ThemedText';
import { ActivityIndicator, StyleSheet, Alert, View } from 'react-native';
import Api, { MatrixDetails, MatrixDestination, MatrixSource } from '../../services/Api'; // Adjust path
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function MatrixDetailScreen() {

  const { id } = useLocalSearchParams();
  const matrixId = Number(id);

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Get the navigation object for the current screen
  const navigation = useNavigation();

  // --- State is now managed by this screen ---
  const [matrixData, setMatrixData] = useState<MatrixDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for polling timers
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);
  const repollTimer = useRef<NodeJS.Timeout | null>(null);

  // --- Data fetching and polling logic now lives here ---
  const fetchData = useCallback(async () => {
    if (isNaN(matrixId)) return;
    setError(null);
    try {
      const response = await Api.getMatrixDetails(matrixId);
      setMatrixData(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch matrix state.");
    } finally {
      setIsLoading(false);
    }
  }, [matrixId]);

  // We can use a standard useEffect here because polling is managed inside
  useEffect(() => {
    setIsLoading(true);
    fetchData();

    const pollInterval = setInterval(fetchData, 5000);
    return () => clearInterval(pollInterval);
  }, [fetchData]);

  // --- THE FIX: A new useEffect to update the header ---
  // This effect runs whenever the matrixData state changes.
  useEffect(() => {
    if (matrixData?.name) {
      // Use the navigation object to imperatively set the options
      navigation.setOptions({
        title: matrixData.name,
      });
    }
  }, [navigation, matrixData]); // Dependencies: run when navigation or data changes
  

  // Interaction handler for button clicks
  const handleInteraction = async (apiCall: () => Promise<any>) => {
    if (pollingTimer.current) clearInterval(pollingTimer.current);
    if (repollTimer.current) clearTimeout(repollTimer.current);
    try {
      await apiCall();
      await fetchData(); // Immediate refresh
      repollTimer.current = setTimeout(() => {
        fetchData(); // 200ms repoll
        pollingTimer.current = setInterval(fetchData, 5000); // Restart main poll
      }, 200);
    } catch (err: any) {
      Alert.alert("Error", `Action failed: ${err.message}`);
      pollingTimer.current = setInterval(fetchData, 5000); // Restart polling on failure
    }
  };

  const onButtonClick = (dst: MatrixDestination, src: MatrixSource) => {
    const isPatchedState = ['patched', 'partial', 'inactive'].includes(dst.state);
    if (isPatchedState) {
      handleInteraction(() => Api.unpatchConnection(dst.id));
    } else {
      handleInteraction(() => Api.patchConnection(dst.id, src.id));
    }
  };

  // --- Render Logic ---
  if (isLoading && !matrixData) { // Adjusted loading condition
    return <ActivityIndicator size="large" style={styles.centered} color={theme.primary} />;
  }
  if (error) {
    return <ThemedText style={[styles.centered, { color: theme.destructive }]}>{error}</ThemedText>;
  }
  if (!matrixData) {
    return <ThemedText style={styles.centered}>Matrix not found.</ThemedText>;
  }

  return (
    <ThemedView style={styles.container}>

      <Stack.Screen options={{ 
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
      }} />

      {/* Display the description above the grid */}
      {matrixData.description && (
        <View style={[styles.descriptionContainer, { borderBottomColor: theme.border }]}>
          <ThemedText style={styles.descriptionText}>{matrixData.description}</ThemedText>
        </View>
      )}

      {/* Pass the data down to the presentational MatrixView component */}
      <MatrixView
        sources={matrixData.srcs}
        destinations={matrixData.dsts}
        onButtonClick={onButtonClick}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  descriptionContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  descriptionText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.8,
  },
});