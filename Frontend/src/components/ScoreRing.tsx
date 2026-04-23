// src/components/ScoreRing.tsx
// Animated circular score ring using react-native-svg

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';

interface Props {
  score: number;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ScoreRing: React.FC<Props> = ({ score, size = 160 }) => {
  const radius      = (size / 2) - 14;
  const circumf     = 2 * Math.PI * radius;
  const targetOffset= circumf - (circumf * score / 100);

  const animOffset = useRef(new Animated.Value(circumf)).current;
  const animScore  = useRef(new Animated.Value(0)).current;
  const displayRef = useRef(0);
  const [display, setDisplay] = React.useState(0);

  const strokeColor = score >= 75 ? Colors.leafLite
                    : score >= 50 ? Colors.wheat
                    : '#e05555';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animOffset, {
        toValue:         targetOffset,
        duration:        1300,
        useNativeDriver: false,
      }),
      Animated.timing(animScore, {
        toValue:         score,
        duration:        1100,
        useNativeDriver: false,
      }),
    ]).start();

    animScore.addListener(({ value }) => {
      const rounded = Math.round(value);
      if (rounded !== displayRef.current) {
        displayRef.current = rounded;
        setDisplay(rounded);
      }
    });

    return () => animScore.removeAllListeners();
  }, [score]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Background track */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={10}
        />
        {/* Animated fill */}
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumf}
          strokeDashoffset={animOffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {/* Center text */}
      <View style={styles.center}>
        <Text style={styles.number}>{display}</Text>
        <Text style={styles.denom}>/100</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  center: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  number: {
    fontSize:   46,
    fontWeight: '800',
    color:      Colors.white,
    lineHeight: 50,
    fontFamily: 'serif',
  },
  denom: {
    fontSize:  14,
    color:     'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
});

export default ScoreRing;
