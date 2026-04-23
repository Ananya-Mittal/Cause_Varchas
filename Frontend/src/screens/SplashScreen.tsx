// src/screens/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Spacing } from '../theme/colors';
import { RootStackParamList } from '../types';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Splash'> };

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => navigation.replace('Login'), 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.soil} />
      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        <Text style={styles.emoji}>🌾</Text>
        <Text style={styles.title}>Varchas</Text>
        <Text style={styles.sub}>Agri Credit AI</Text>
      </Animated.View>
      <Text style={styles.tagline}>Smart loans for smart farmers</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.soil,
    alignItems:      'center',
    justifyContent:  'center',
  },
  content: { alignItems: 'center' },
  emoji:   { fontSize: 64, marginBottom: Spacing.md },
  title: {
    fontFamily: 'serif',
    fontSize:   46,
    fontWeight: '900',
    color:      Colors.white,
    letterSpacing: 2,
  },
  sub: {
    fontSize:      14,
    color:         Colors.leafLite,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop:     6,
  },
  tagline: {
    position: 'absolute',
    bottom:   48,
    fontSize: 13,
    color:    'rgba(255,255,255,0.35)',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
