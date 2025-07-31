// components/MatrixView.tsx
import React, { useRef } from 'react';
import { View, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { ThemedText } from './ThemedText';
import { CrosspointButton } from './CrosspointButton';
import { Meter } from './Meter';
import { MeterLevels, MatrixDestination, MatrixSource } from '../services/Api';

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
  const headerScrollViewRef = useRef<ScrollView>(null);
  const bodyScrollViewRef = useRef<ScrollView>(null);
  const isScrollingByCode = useRef(false);

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

  const syncScroll = (event: NativeSyntheticEvent<NativeScrollEvent>, otherRef: React.RefObject<ScrollView>) => {
    if (isScrollingByCode.current) {
        isScrollingByCode.current = false;
        return;
    }
    isScrollingByCode.current = true;
    const xOffset = event.nativeEvent.contentOffset.x;
    otherRef.current?.scrollTo({ x: xOffset, animated: false });
  };
  
  return (
    <View style={styles.container}>
      {/* --- Section 1: Fixed Headers (Meters and Source Names) --- */}
      <View style={styles.fixedHeaderContainer}>
        <ScrollView
          ref={headerScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={true} // ✅ FIX: Ensure scrollbar is enabled
          scrollEventThrottle={16}
          onScroll={(e) => syncScroll(e, bodyScrollViewRef)}
        >
          <View>
            <View style={styles.meterRow}>
              {sources.map(src => {
                const levels = meterLevels[src.id];
                return (
                  <View key={src.id} style={styles.meterCell}>
                    <Meter
                      lpk={levels?.left?.[0]}
                      lrms={levels?.left?.[1]}
                      rpk={levels?.right?.[0]}
                      rrms={levels?.right?.[1]}
                    />
                  </View>
                );
              })}
            </View>
            <View style={styles.sourceHeaderRow}>
              {sources.map(src => (
                <View key={src.id} style={styles.sourceHeaderCell}>
                  <ThemedText style={styles.sourceHeaderText} numberOfLines={2}>{src.name}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        <View style={styles.headerSpacer} />
      </View>

      {/* --- Section 2: Vertically Scrollable Body (Grid and Destination Names) --- */}
      <ScrollView style={styles.scrollableBodyContainer}>
        <View style={styles.bodyLayout}>
          <ScrollView
            ref={bodyScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={true}
            nestedScrollEnabled={true} // ✅ FIX: Allow nested scrolling on native
            scrollEventThrottle={16}
            onScroll={(e) => syncScroll(e, headerScrollViewRef)}
          >
            <View>
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
          <View style={styles.destinationLabelsContainer}>
            {destinations.map(dst => (
              <View key={dst.id} style={styles.destinationLabelCell}>
                <ThemedText style={styles.destinationLabelText} numberOfLines={2}>{dst.name}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeaderContainer: {
    flexDirection: 'row',
    height: METER_HEIGHT + HEADER_HEIGHT,
    borderBottomWidth: 2,
    borderColor: '#999',
  },
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
    borderLeftWidth: 1,
    borderColor: '#ccc',
  },
  sourceHeaderText: {
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  headerSpacer: {
    width: DEST_LABEL_WIDTH,
  },
  scrollableBodyContainer: {
    flex: 1,
  },
  bodyLayout: {
    flexDirection: 'row',
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
