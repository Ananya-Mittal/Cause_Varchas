// src/screens/HomeScreen.tsx
// Main credit assessment form with GPS + crop selector

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
  Platform, PermissionsAndroid,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';

import { creditAPI } from '../api/client';
import { Colors, Spacing, Radius, Shadow } from '../theme/colors';
import { RootStackParamList, MainTabParamList } from '../types';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;
type Props = { navigation: NavProp };

const CROPS = [
  { label: '🌾 Wheat',      value: 'wheat'     },
  { label: '🌾 Rice',       value: 'rice'      },
  { label: '🌽 Maize',      value: 'maize'     },
  { label: '🏵 Cotton',     value: 'cotton'    },
  { label: '🎋 Sugarcane',  value: 'sugarcane' },
  { label: '🟢 Soybean',    value: 'soybean'   },
  { label: '🥜 Groundnut',  value: 'groundnut' },
  { label: '🟡 Mustard',    value: 'mustard'   },
  { label: '🌿 Barley',     value: 'barley'    },
  { label: '🌾 Sorghum',    value: 'sorghum'   },
];

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [lat,      setLat]      = useState('');
  const [lon,      setLon]      = useState('');
  const [crop,     setCrop]     = useState('wheat');
  const [areaHa,   setAreaHa]   = useState('1');
  const [cropAge,  setCropAge]  = useState('0.5');
  const [loading,  setLoading]  = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [serverOk,   setServerOk]   = useState<boolean | null>(null);

  useEffect(() => {
    // Check server health on mount
    creditAPI.healthCheck().then(ok => setServerOk(ok));
  }, []);

  // ── Request GPS permission ────────────────────────────────────────────
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title:   'Location Permission',
          message: 'Varchas needs your location to fetch satellite data.',
          buttonPositive: 'Allow',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS handles via Info.plist
  };

const useGPS = async () => {
  try {
    setGpsLoading(true);

    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Please enable location permission in settings.'
      );
      setGpsLoading(false);
      return;
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    if (!location?.coords) {
      throw new Error('Unable to fetch location');
    }

    setLat(location.coords.latitude.toFixed(5));
    setLon(location.coords.longitude.toFixed(5));

  } catch (err: any) {
    Alert.alert('GPS Error', err?.message || 'Failed to get location');
  } finally {
    setGpsLoading(false);
  }
};
  // ── Validate + submit ─────────────────────────────────────────────────
  const handleCalculate = async () => {
    const latN  = parseFloat(lat);
    const lonN  = parseFloat(lon);
    const areaN = parseFloat(areaHa) || 1;
    const ageN  = parseFloat(cropAge) || 0.5;

    if (isNaN(latN) || isNaN(lonN)) {
      Alert.alert('Invalid Input', 'Please enter valid coordinates.'); return;
    }
    if (latN < -90 || latN > 90 || lonN < -180 || lonN > 180) {
      Alert.alert('Out of Range', 'Latitude: -90 to 90\nLongitude: -180 to 180'); return;
    }

    setLoading(true);
    try {
      const result = await creditAPI.calculate({
        lat: latN, lon: lonN, crop,
        area_ha: areaN, crop_age: ageN,
      });
      navigation.navigate('Result', { data: result });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.soil} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🌾</Text>
        <View>
          <Text style={styles.headerTitle}>Agri Credit</Text>
          <Text style={styles.headerSub}>Smart loan assessment</Text>
        </View>
        <View style={[styles.serverDot, {
          backgroundColor: serverOk === true ? Colors.leafLite
                         : serverOk === false ? '#e05555' : Colors.wheat
        }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Location card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>📍  Farm Location</Text>

          <TouchableOpacity
            style={styles.gpsBtn}
            onPress={useGPS}
            disabled={gpsLoading}
            activeOpacity={0.8}
          >
            {gpsLoading
              ? <ActivityIndicator size="small" color={Colors.leaf} />
              : <Text style={styles.gpsIcon}>📡</Text>
            }
            <Text style={styles.gpsBtnText}>
              {gpsLoading ? 'Getting location…' : 'Use My Current Location'}
            </Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={[styles.field, { marginRight: 8 }]}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 28.6139"
                placeholderTextColor={Colors.textHint}
                value={lat}
                onChangeText={setLat}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 77.2090"
                placeholderTextColor={Colors.textHint}
                value={lon}
                onChangeText={setLon}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* ── Crop card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>🌱  Crop Details</Text>

          <Text style={styles.label}>Crop Type</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={crop}
              onValueChange={setCrop}
              style={styles.picker}
              dropdownIconColor={Colors.textMid}
            >
              {CROPS.map(c => (
                <Picker.Item key={c.value} label={c.label} value={c.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { marginRight: 8 }]}>
              <Text style={styles.label}>Area (hectares)</Text>
              <TextInput
                style={styles.input}
                placeholder="1.0"
                placeholderTextColor={Colors.textHint}
                value={areaHa}
                onChangeText={setAreaHa}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Season Progress (0–1)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.5"
                placeholderTextColor={Colors.textHint}
                value={cropAge}
                onChangeText={setCropAge}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.calcBtn, loading && styles.calcBtnDisabled]}
          onPress={handleCalculate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <>
                <ActivityIndicator color={Colors.white} style={{ marginRight: 10 }} />
                <Text style={styles.calcBtnText}>Analysing farm data…</Text>
              </>
            : <Text style={styles.calcBtnText}>🔍  Calculate Credit Score</Text>
          }
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Data from Google Earth Engine · Open-Meteo · ML Ensemble Model
        </Text>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },

  header: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.soil,
    paddingHorizontal: Spacing.lg,
    paddingTop:      Platform.OS === 'ios' ? 54 : 16,
    paddingBottom:   18,
    gap:             12,
  },
  headerEmoji:  { fontSize: 28 },
  headerTitle: {
    fontFamily: 'serif', fontSize: 22, fontWeight: '800',
    color: Colors.white,
  },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  serverDot: {
    width: 9, height: 9, borderRadius: 5,
    marginLeft: 'auto',
  },

  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 40 },

  card: {
    backgroundColor: Colors.offWhite,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    marginBottom:    Spacing.md,
    ...Shadow.card,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  sectionLabel: {
    fontSize:      11,
    fontWeight:    '600',
    color:         Colors.leaf,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom:  Spacing.md,
  },

  gpsBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    backgroundColor: 'rgba(45,106,63,0.08)',
    borderWidth:     1,
    borderColor:     'rgba(45,106,63,0.3)',
    borderStyle:     'dashed',
    borderRadius:    Radius.md,
    paddingVertical: 12,
    marginBottom:    Spacing.md,
  },
  gpsIcon:    { fontSize: 16 },
  gpsBtnText: { fontSize: 14, fontWeight: '500', color: Colors.leaf },

  row:   { flexDirection: 'row' },
  field: { flex: 1 },
  label: {
    fontSize: 12, fontWeight: '500', color: Colors.textMid,
    marginBottom: 6, letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: 14, color: Colors.textDark, backgroundColor: Colors.white,
  },

  pickerWrap: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    backgroundColor: Colors.white, marginBottom: Spacing.md, overflow: 'hidden',
  },
  picker: { color: Colors.textDark },

  calcBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.soil,
    borderRadius:    Radius.md,
    paddingVertical: 18,
    ...Shadow.strong,
  },
  calcBtnDisabled: { backgroundColor: '#9a9088' },
  calcBtnText: {
    color: Colors.white, fontSize: 17, fontWeight: '700', fontFamily: 'serif',
  },

  disclaimer: {
    textAlign:  'center',
    fontSize:   11,
    color:      Colors.textHint,
    marginTop:  Spacing.md,
    lineHeight: 16,
  },
});

export default HomeScreen;
