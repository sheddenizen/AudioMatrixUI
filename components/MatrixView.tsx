// components/MatrixView.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { ThemedText } from './ThemedText';
import Api, { LineItem, MatrixDetails } from '../services/Api'; // Adjust path as needed
import { Colors, ThemeColors } from '../constants/Colors';
import { CrosspointButton } from './CrosspointButton';

// Define the rich destination type coming from the API
interface MatrixDestination extends LineItem {
  state: 'patched' | 'partial' | 'inactive' | 'overpatched' | 'unpatched';
  desired?: {
    src: number;
    [role: string]: any;
  };
  others?: {
    src: number;
    [role: string]: any;
  }[];
}

interface MatrixViewProps {
  matrixId: number;
}

const ROW_HEIGHT = 50;
const HEADER_HEIGHT = 60;
const SOURCE_CELL_WIDTH = 80;
const DEST_LABEL_WIDTH = 120;

export const MatrixView: React.FC<MatrixViewProps> = ({ matrixId }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [sources, setSources] = useState<LineItem[]>([]);
  const [destinations, setDestinations] = useState<MatrixDestination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to hold timer IDs to prevent memory leaks and race conditions
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);
  const repollTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (isInteraction = false) => {
    if (!isInteraction) {
      // Don't show loading spinner for background polls
      // setIsLoading(true); 
    }
    setError(null);
    try {
      const response = await Api.getMatrixDetails(matrixId);
      setSources(response.data.srcs || []);
      setDestinations(response.data.dsts || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch matrix state.");
    } finally {
      setIsLoading(false);
    }
  }, [matrixId]);

  // Polling logic
  useEffect(() => {
    fetchData(); // Initial fetch

    // Clear any existing timers before setting a new one
    if (pollingTimer.current) clearInterval(pollingTimer.current);
    if (repollTimer.current) clearTimeout(repollTimer.current);

    // Set up periodic polling
    pollingTimer.current = setInterval(() => {
      fetchData();
    }, 5000); // Poll every 5 seconds

    // Cleanup on component unmount
    return () => {
      if (pollingTimer.current) clearInterval(pollingTimer.current);
      if (repollTimer.current) clearTimeout(repollTimer.current);
    };
  }, [fetchData]);

  // Handler for user interaction (button click)
  const handleInteraction = async (apiCall: () => Promise<any>) => {
    // Stop all polling timers to prevent race conditions
    if (pollingTimer.current) clearInterval(pollingTimer.current);
    if (repollTimer.current) clearTimeout(repollTimer.current);

    try {
      await apiCall();
      // 1. Immediate poll after click
      await fetchData(true);

      // 2. Schedule a repoll after 200ms
      repollTimer.current = setTimeout(() => {
        fetchData(true);
        // 3. Restart the main polling loop after the interaction is fully settled
        pollingTimer.current = setInterval(() => fetchData(), 5000);
      }, 200);

    } catch (err: any) {
      Alert.alert("Error", `Action failed: ${err.message}`);
      // Restart polling even if the action fails
      pollingTimer.current = setInterval(() => fetchData(), 5000);
    }
  };

  const onButtonClick = (dst: MatrixDestination, src: LineItem) => {
    const isPatchedState = ['patched', 'partial', 'inactive'].includes(dst.state);

    if (isPatchedState) {
      // If the destination is patched in any way, unpatch it completely
      handleInteraction(() => Api.unpatchConnection(dst.id));
    } else {
      // If it's unpatched or overpatched, create a new desired patch
      handleInteraction(() => Api.patchConnection(dst.id, src.id));
    }
  };
  
  // Logic to determine the state of an individual button
  const getButtonState = (dst: MatrixDestination, src: LineItem): ('patched' | 'desired_inactive' | 'overpatched' | 'unpatched') => {
    const isDesired = dst.desired?.src === src.id;
    
    const isActiveInOthers = !!dst.others?.some(o => o.src === src.id);

    if (isDesired) {
        // A 'patched' or 'partial' state for the row means the desired source is at least partially connected
        return (dst.state === 'patched' || dst.state === 'partial') ? 'patched' : 'desired_inactive';
    } else if (isActiveInOthers) {
        return 'overpatched';
    }

    return 'unpatched';
  };

  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.centered} color={theme.primary} />;
  }

  if (error) {
    return <ThemedText style={[styles.centered, { color: theme.destructive }]}>{error}</ThemedText>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.matrixLayout}>
        {/* ---- Part 1: The Horizontally Scrolling Grid ---- */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Row 1: Source Headers */}
            <View style={styles.sourceHeaderRow}>
              {sources.map(src => (
                <View key={src.id} style={styles.sourceHeaderCell}>
                  <ThemedText style={styles.sourceHeaderText}>{src.name}</ThemedText>
                </View>
              ))}
            </View>

            {/* Grid Body: Rows of Buttons */}
            {destinations.map(dst => (
              <View key={dst.id} style={styles.gridRow}>
                {sources.map(src => (
                  <CrosspointButton
                    key={`${dst.id}-${src.id}`}
                    state={getButtonState(dst, src)}
                    onClick={() => onButtonClick(dst, src)}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* ---- Part 2: The Fixed Destination Labels (on the right) ---- */}
        <View style={styles.destinationLabelsContainer}>
          {/* Spacer to align with the source header row */}
          <View style={styles.headerSpacer} />
          {/* The actual destination labels */}
          {destinations.map(dst => (
            <View key={dst.id} style={styles.destinationLabelCell}>
              <ThemedText style={styles.destinationLabelText} numberOfLines={2}>{dst.name}</ThemedText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matrixLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  // --- Scrolling Part ---
  sourceHeaderRow: {
    flexDirection: 'row',
    height: HEADER_HEIGHT,
  },
  sourceHeaderCell: {
    width: SOURCE_CELL_WIDTH,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
  sourceHeaderText: {
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  // --- Fixed Part ---
  destinationLabelsContainer: {
    width: DEST_LABEL_WIDTH,
    borderLeftWidth: 2, // A thicker border to separate it
  },
  headerSpacer: {
    height: HEADER_HEIGHT, // Must match the source header height
    borderBottomWidth: 1,
  },
  destinationLabelCell: {
    height: ROW_HEIGHT, // Must match the grid row height
    justifyContent: 'center',
    paddingLeft: 10,
    borderBottomWidth: 1,
  },
  destinationLabelText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
});
