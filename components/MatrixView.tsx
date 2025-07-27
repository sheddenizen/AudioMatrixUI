// components/MatrixView.tsx
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { CrosspointButton } from './CrosspointButton';
import { Meter } from './Meter'; // Import the Meter component
import { MeterLevels, MatrixDestination, MatrixSource } from '../services/Api'; // Adjust path as needed

interface MatrixViewProps {
  sources: MatrixSource[];
  destinations: MatrixDestination[];
  meterLevels: MeterLevels;
  onButtonClick: (dst: MatrixDestination, src: MatrixSource) => void;
}

// Layout Constants
const ROW_HEIGHT = 50;
const HEADER_HEIGHT = 60;
const METER_HEIGHT = 220;
const SOURCE_CELL_WIDTH = 80;
const DEST_LABEL_WIDTH = 120;

export const MatrixView: React.FC<MatrixViewProps> = ({ sources, destinations, meterLevels, onButtonClick }) => {

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
  if (Object.keys(meterLevels).length < Object.keys(sources).length)
   console.log(meterLevels);
  else {
    for (const [k, v ] of Object.entries(meterLevels)) {
      try {
        if (!("left" in v) || !("right" in v)) {
          console.log(`${k} missing entries. ${meterLevels}`);
        }
      } catch (e) {console.log(`Ex, "${e}" checking ${k} in ${meterLevels} what now?`); break;}
    }
  }

  return (
    <View style={styles.matrixLayout}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {/* --- Meter Row --- */}
          <View style={styles.meterRow}>
            {sources.map(src => {
              const levels = meterLevels[src.id];
              return (
                <View key={src.id} style={styles.meterCell}>
                  <Meter
                    // ✅ THE FIX: Check if levels.left and levels.right exist before accessing them.
                    // Use optional chaining `?.` and the nullish coalescing operator `??` for a safe fallback.
                    lpk={levels?.left?.[0]}
                    lrms={levels?.left?.[1]}
                    rpk={levels?.right?.[0]}
                    rrms={levels?.right?.[1]}
                  />
                </View>
              );
            })}
          </View>
          
          {/* --- Source Headers Row --- */}
          <View style={styles.sourceHeaderRow}>
            {sources.map(src => (
              <View key={src.id} style={styles.sourceHeaderCell}>
                <ThemedText style={styles.sourceHeaderText} numberOfLines={2}>{src.name}</ThemedText>
              </View>
            ))}
          </View>

          {/* --- Grid Body: Rows of Buttons --- */}
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

      {/* --- Fixed Destination Labels --- */}
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

// --- Styles ---
const styles = StyleSheet.create({
  matrixLayout: { flex: 1, flexDirection: 'row' },
  meterRow: {
    flexDirection: 'row',
    height: METER_HEIGHT,
  },
  meterCell: {
    width: SOURCE_CELL_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    borderColor: '#ccc',
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
    borderColor: '#ccc'
  },
  destinationLabelsContainer: {
    width: DEST_LABEL_WIDTH,
    borderLeftWidth: 2,
    borderColor: '#999',
  },
  headerSpacer: {
    height: METER_HEIGHT + HEADER_HEIGHT,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  destinationLabelCell: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    paddingLeft: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  destinationLabelText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
});