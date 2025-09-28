// Solution 1: Animated Version using react-native-reanimated
// This uses native animations and is much more performant
import React, { useEffect } from 'react';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  interpolate 
} from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);

interface MeterProps {
  lrms?: number;
  rrms?: number;
  lpk?: number;
  rpk?: number;
}

// Same constants as before
const SVG_WIDTH = 70;
const SVG_HEIGHT = 220;
const BAR_WIDTH = 12;
const BAR_Y_TOP = 10;
const BAR_Y_BOTTOM = 210;
const BAR_HEIGHT = BAR_Y_BOTTOM - BAR_Y_TOP;
const DB_TOP = 14;
const DB_BOTTOM = -36;
const DB_RANGE = DB_TOP - DB_BOTTOM;
const LEFT_BAR_X = SVG_WIDTH / 4 - BAR_WIDTH / 2;
const RIGHT_BAR_X = (3 * SVG_WIDTH) / 4 - BAR_WIDTH / 2;
const SCALE_VALUES = [-30, -20, -12, -6, 0, 6, 12];

export const Meter: React.FC<MeterProps> = ({
  lrms = DB_BOTTOM,
  rrms = DB_BOTTOM,
  lpk = DB_BOTTOM,
  rpk = DB_BOTTOM,
}) => {
  // Shared values for animations
  const lrmsValue = useSharedValue(DB_BOTTOM);
  const rrmsValue = useSharedValue(DB_BOTTOM);
  const lpkValue = useSharedValue(DB_BOTTOM);
  const rpkValue = useSharedValue(DB_BOTTOM);

  const dbToPercent = (db: number): number => {
    const clampedDb = Math.max(DB_BOTTOM, Math.min(db, DB_TOP));
    return (clampedDb - DB_BOTTOM) / DB_RANGE;
  };

  const dbToY = (db: number): number => {
    const percent = dbToPercent(db);
    return BAR_Y_BOTTOM - (percent * BAR_HEIGHT);
  };

  // Update animated values when props change
  useEffect(() => {
    lrmsValue.value = withTiming(lrms + 20, { duration: 50 });
    rrmsValue.value = withTiming(rrms + 20, { duration: 50 });
    lpkValue.value = withTiming(lpk + 20, { duration: 50 });
    rpkValue.value = withTiming(rpk + 20, { duration: 50 });
  }, [lrms, rrms, lpk, rpk]);

  // Animated props for left RMS bar
  const leftRmsProps = useAnimatedProps(() => {
    const y = interpolate(
      lrmsValue.value,
      [DB_BOTTOM, DB_TOP],
      [BAR_Y_BOTTOM, BAR_Y_TOP]
    );
    return {
      y,
      height: BAR_Y_BOTTOM - y,
    };
  });

  // Animated props for right RMS bar
  const rightRmsProps = useAnimatedProps(() => {
    const y = interpolate(
      rrmsValue.value,
      [DB_BOTTOM, DB_TOP],
      [BAR_Y_BOTTOM, BAR_Y_TOP]
    );
    return {
      y,
      height: BAR_Y_BOTTOM - y,
    };
  });

  // Animated props for left peak line
  const leftPkProps = useAnimatedProps(() => {
    const y = interpolate(
      lpkValue.value,
      [DB_BOTTOM, DB_TOP],
      [BAR_Y_BOTTOM, BAR_Y_TOP]
    );
    return { y1: y, y2: y };
  });

  // Animated props for right peak line
  const rightPkProps = useAnimatedProps(() => {
    const y = interpolate(
      rpkValue.value,
      [DB_BOTTOM, DB_TOP],
      [BAR_Y_BOTTOM, BAR_Y_TOP]
    );
    return { y1: y, y2: y };
  });

  return (
    <Svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
      {/* Static background - only renders once */}
      <Rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="#222" />
      
      {/* Static scale - only renders once */}
      {SCALE_VALUES.map(val => (
        <React.Fragment key={`scale-${val}`}>
          <SvgText
            x={SVG_WIDTH / 2}
            y={dbToY(val) - 2}
            textAnchor="middle"
            fill={val >= 0 ? "#fff" : "#aaa"}
            fontSize="10px"
            fontFamily="sans-serif"
          >
            {val}
          </SvgText>
          <Line
            x1={SVG_WIDTH / 4 + BAR_WIDTH/2 + 2}
            x2={3 * SVG_WIDTH / 4 - BAR_WIDTH/2 - 2}
            y1={dbToY(val)}
            y2={dbToY(val)}
            stroke={val >= 0 ? "#fff" : "#aaa"}
            strokeWidth="1"
          />
        </React.Fragment>
      ))}

      {/* Animated RMS Bars */}
      <AnimatedRect 
        x={LEFT_BAR_X} 
        width={BAR_WIDTH} 
        fill="#2c2" 
        animatedProps={leftRmsProps}
      />
      <AnimatedRect 
        x={RIGHT_BAR_X} 
        width={BAR_WIDTH} 
        fill="#2c2" 
        animatedProps={rightRmsProps}
      />

      {/* Animated Peak Lines */}
      <AnimatedLine
        x1={LEFT_BAR_X}
        x2={LEFT_BAR_X + BAR_WIDTH}
        strokeWidth="3"
        stroke="#c22"
        animatedProps={leftPkProps}
      />
      <AnimatedLine
        x1={RIGHT_BAR_X}
        x2={RIGHT_BAR_X + BAR_WIDTH}
        strokeWidth="3"
        stroke="#c22"
        animatedProps={rightPkProps}
      />
    </Svg>
  );
};
