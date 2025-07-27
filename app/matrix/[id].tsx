// app/matrix/[id].tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stack, useLocalSearchParams, useNavigation, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { MatrixView } from '@/components/MatrixView';
import { ThemedText } from '@/components/ThemedText';
import { ActivityIndicator, StyleSheet, Alert, View } from 'react-native';
import Api, { MatrixDetails, LineItem, MeterLevels } from '../../services/Api';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

// (This interface can be moved to a shared types file if you wish)
interface MatrixDestination extends LineItem {
  state: 'patched' | 'partial' | 'inactive' | 'overpatched' | 'unpatched';
  desired?: { src: number; [role: string]: any; };
  others?: { src: number; [role: string]: any; }[];
}

export default function MatrixDetailScreen() {
  const { id } = useLocalSearchParams();
  const matrixId = Number(id);

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const navigation = useNavigation();

  const [matrixData, setMatrixData] = useState<MatrixDetails | null>(null);
  const [meterLevels, setMeterLevels] = useState<MeterLevels>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- A single, robust effect to manage all data fetching and polling ---
  useFocusEffect(
    useCallback(() => {
      let isMounted = true; // Flag to prevent state updates if component unmounts
      let mainPoll: NodeJS.Timeout | undefined;
      let meterPoll: NodeJS.Timeout | undefined;

      const fetchAndStartPolling = async () => {
        if (isNaN(matrixId)) {
          setError("Invalid Matrix ID.");
          setIsLoading(false);
          return;
        }
        
        // Don't show the main spinner for background refreshes
        if (!matrixData) setIsLoading(true);
        setError(null);

        try {
          // 1. Fetch the main matrix data first
          const response = await Api.getMatrixDetails(matrixId);
          if (!isMounted) return; // Stop if we've navigated away

          const data = response.data;
          setMatrixData(data);
          setIsLoading(false); // ✅ Data is loaded, stop the main spinner

          // 2. Now that we have the data, set up the polling loops
          mainPoll = setInterval(async () => {
            try {
              const pollResponse = await Api.getMatrixDetails(matrixId);
              if (isMounted) setMatrixData(pollResponse.data);
            } catch (e) { console.error("Main poll failed:", e); }
          }, 5000); // Slow poll for matrix state

          let meterinProgress = false;
          if (data.meterurl) {
            meterPoll = setInterval(async () => {
              try {
                if (meterinProgress) {
                  console.log("Meter update inprogress, coming back next time");
                  return;
                }
                meterinProgress = true;

                const meterResponse = await Api.getMeterLevels(data.meterurl);
                if (isMounted) {
                  if (typeof(meterResponse.data) != 'object')
                    console.log("Unexpected meter data type", typeof(meterResponse.data), "value", meterResponse.data);
                  else
                    setMeterLevels(meterResponse.data);
                }
              } catch (e) { console.error("Meter poll failed:", e); }
              meterinProgress = false;

            }, 100); // Fast 10Hz poll for meters
          }

        } catch (err: any) {
          if (isMounted) {
            setError(err.message || "Failed to fetch matrix state.");
            setIsLoading(false);
          }
        }
      };

      fetchAndStartPolling();

      // 3. Cleanup function: this runs when you navigate away from the screen
      return () => {
        isMounted = false;
        if (mainPoll) clearInterval(mainPoll);
        if (meterPoll) clearInterval(meterPoll);
      };
    }, [matrixId]) // This whole effect block only re-runs if the matrixId changes
  );
  
  // This effect for setting the header title is still good
  useEffect(() => {
    if (matrixData?.name) {
      navigation.setOptions({ title: matrixData.name });
    }
  }, [navigation, matrixData]);

  // The interaction handler now just needs to trigger a refetch
  // The useFocusEffect logic is smart enough to handle restarting polls
  const onButtonClick = async (dst: MatrixDestination, src: LineItem) => {
    const isPatchedState = ['patched', 'partial', 'inactive'].includes(dst.state);
    const apiCall = isPatchedState
      ? () => Api.unpatchConnection(dst.id)
      : () => Api.patchConnection(dst.id, src.id);

    try {
      await apiCall();
      // After a successful action, just refetch the main data.
      // The meter poll will continue running independently.
      const response = await Api.getMatrixDetails(matrixId);
      setMatrixData(response.data);
    } catch (err: any) {
      Alert.alert("Error", `Action failed: ${err.message}`);
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.centered} color={theme.primary} />;
  }
  if (error || !matrixData) {
    return <ThemedText style={[styles.centered, { color: theme.destructive }]}>{error || 'Matrix data not found.'}</ThemedText>;
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: matrixData.name || `Matrix #${id}` }} />

      {matrixData.description && (
        <View style={[styles.descriptionContainer, { borderBottomColor: theme.border }]}>
          <ThemedText style={styles.descriptionText}>{matrixData.description}</ThemedText>
        </View>
      )}
      
      <MatrixView
        sources={matrixData.srcs}
        destinations={matrixData.dsts}
        meterLevels={meterLevels}
        onButtonClick={onButtonClick}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  descriptionContainer: { paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1 },
  descriptionText: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', opacity: 0.8 },
});
