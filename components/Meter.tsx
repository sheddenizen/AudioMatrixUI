// components/Meter.tsx
import React from 'react';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

interface MeterProps {
  lrms?: number;
  rrms?: number;
  lpk?: number;
  rpk?: number;
}

// --- Define the meter's geometry and scale ---
const SVG_WIDTH = 70;
const SVG_HEIGHT = 220;
const BAR_WIDTH = 12;

// Y-coordinates for the top and bottom of the bar area inside the SVG
const BAR_Y_TOP = 10;
const BAR_Y_BOTTOM = 210;
const BAR_HEIGHT = BAR_Y_BOTTOM - BAR_Y_TOP; // Total pixel height of the meter

// The dB range the meter will display
const DB_TOP = 14;    // The highest value on the scale
const DB_BOTTOM = -36;  // The lowest value (floor)
const DB_RANGE = DB_TOP - DB_BOTTOM;

// The X-coordinates for the left and right channel bars
const LEFT_BAR_X = SVG_WIDTH / 4 - BAR_WIDTH / 2;
const RIGHT_BAR_X = (3 * SVG_WIDTH) / 4 - BAR_WIDTH / 2;

// The dB values to draw on the scale
const SCALE_VALUES = [-30, -20, -12, -6, 0, 6, 12];

export const Meter: React.FC<MeterProps> = ({
  lrms = DB_BOTTOM,
  rrms = DB_BOTTOM,
  lpk = DB_BOTTOM,
  rpk = DB_BOTTOM,
}) => {

  /**
   * Converts a dB value to its Y-coordinate on the SVG canvas.
   * A higher dB value results in a lower Y-coordinate (closer to the top).
   */
  const dbToY = (db: number): number => {
    const clampedDb = Math.max(DB_BOTTOM, Math.min(db, DB_TOP));
    const percent = (clampedDb - DB_BOTTOM) / DB_RANGE; // Position from 0.0 to 1.0
    return BAR_Y_BOTTOM - (percent * BAR_HEIGHT);
  };
  // Meter API outputs db fsd, while we are displaying K20
  const lrms_y = dbToY(lrms+20);
  const rrms_y = dbToY(rrms+20);
  const lpk_y = dbToY(lpk+20);
  const rpk_y = dbToY(rpk+20);

  return (
    <Svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
      {/* Background */}
      <Rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="#222" />

      {/* RMS Bars (Green) */}
      <Rect x={LEFT_BAR_X} y={lrms_y} width={BAR_WIDTH} height={BAR_Y_BOTTOM - lrms_y} fill="#2c2" />
      <Rect x={RIGHT_BAR_X} y={rrms_y} width={BAR_WIDTH} height={BAR_Y_BOTTOM - rrms_y} fill="#2c2" />

      {/* Peak Lines (Red) */}
      <Line x1={LEFT_BAR_X} x2={LEFT_BAR_X + BAR_WIDTH} y1={lpk_y} y2={lpk_y} strokeWidth="3" stroke="#c22" />
      <Line x1={RIGHT_BAR_X} x2={RIGHT_BAR_X + BAR_WIDTH} y1={rpk_y} y2={rpk_y} strokeWidth="3" stroke="#c22" />

      {/* Scale Lines and Text */}
      {SCALE_VALUES.map(val => (
        <React.Fragment key={`scale-${val}`}>
          <SvgText
            x={SVG_WIDTH / 2}
            y={dbToY(val)-2} // Position text slightly below the line for alignment
            textAnchor="middle"
            fill={val >= 0 ? "#fff" : "#aaa"}
            fontSize="10px" // Needs unit
            fontFamily="sans-serif"
          >
            {val}
          </SvgText>
          <Line
            x1={SVG_WIDTH / 4 + BAR_WIDTH/2+2}
            x2={3*SVG_WIDTH / 4 - BAR_WIDTH/2-2}
            y1={dbToY(val)}
            y2={dbToY(val)}
            stroke={val >= 0 ? "#fff" : "#aaa"}
            strokeWidth="1"
          />
        </React.Fragment>
      ))}
    </Svg>
  );
};