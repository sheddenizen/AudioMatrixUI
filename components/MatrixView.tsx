// components/MatrixView.tsx

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import Api, { MatrixDestination, MatrixSource } from '../services/Api'; // Adjust path as needed
import { CrosspointButton } from './CrosspointButton';

interface MatrixViewProps {
  sources: MatrixSource[];
  destinations: MatrixDestination[]; // Using the rich destination type
  onButtonClick: (dst: MatrixDestination, src: MatrixSource) => void;
}

// Constants for layout
const ROW_HEIGHT = 50;
const HEADER_HEIGHT = 60;
const SOURCE_CELL_WIDTH = 80;
const DEST_LABEL_WIDTH = 120;

export const MatrixView: React.FC<MatrixViewProps> = ({ sources, destinations, onButtonClick }) => {
  // All fetching and polling logic has been removed from this component.

  // Logic to determine the state of an individual button
  const getButtonState = (dst: MatrixDestination, src: MatrixSource): ('patched' | 'desired_inactive' | 'overpatched' | 'unpatched') => {
    const isDesired = dst.desired?.src === src.id;
    const isActiveInOthers = !!dst.others?.some(o => o.src === src.id);

    if (isDesired) {
      return (dst.state === 'patched' || dst.state === 'partial') ? 'patched' : 'desired_inactive';
    } else if (isActiveInOthers) {
      return 'overpatched';
    }
    return 'unpatched';
  };

  return (
    <View style={styles.matrixLayout}>
      {/* ---- Part 1: The Horizontally Scrolling Grid ---- */}
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {/* Row 1: Source Headers */}
          <View style={styles.sourceHeaderRow}>
            {sources.map(src => (
              <View key={src.id} style={styles.sourceHeaderCell}>
                <ThemedText style={styles.sourceHeaderText} numberOfLines={2}>{src.name}</ThemedText>
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
        <View style={styles.headerSpacer} />
        {destinations.map(dst => (
          <View key={dst.id} style={styles.destinationLabelCell}>
            <ThemedText style={styles.destinationLabelText} numberOfLines={2}>{dst.name}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
};

// Styles remain largely the same
const styles = StyleSheet.create({
  /* ... copy styles from the previous version of MatrixView ... */
  matrixLayout: { flex: 1, flexDirection: 'row' },
  sourceHeaderRow: { flexDirection: 'row', height: HEADER_HEIGHT },
  sourceHeaderCell: { width: SOURCE_CELL_WIDTH, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 5, borderBottomWidth: 1, borderLeftWidth: 1, borderColor: '#ccc' },
  sourceHeaderText: { fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  gridRow: { flexDirection: 'row', height: ROW_HEIGHT, alignItems: 'center', borderBottomWidth: 1, borderColor: '#ccc' },
  destinationLabelsContainer: { width: DEST_LABEL_WIDTH, borderLeftWidth: 2, borderColor: '#999' },
  headerSpacer: { height: HEADER_HEIGHT, borderBottomWidth: 1, borderColor: '#ccc' },
  destinationLabelCell: { height: ROW_HEIGHT, justifyContent: 'center', paddingLeft: 10, borderBottomWidth: 1, borderColor: '#ccc' },
  destinationLabelText: { fontWeight: 'bold', fontSize: 12 },
});
