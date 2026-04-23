// src/screens/ResultScreen.tsx
// Displays credit score results returned by the backend

import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  TouchableOpacity, Platform, Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { Colors, Spacing, Radius, Shadow } from '../theme/colors';
import { RootStackParamList, CreditResponse, ScoreFactor } from '../types';
import ScoreRing from '../components/ScoreRing';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Result'>;
  route:      RouteProp<RootStackParamList, 'Result'>;
};

// ── Decision styles ──────────────────────────────────────────────────────────
const DECISION_STYLE: Record<string, { bg: string; text: string; icon: string; headerBg: string }> = {
  Approve:        { bg: Colors.approveBg,      text: Colors.approve,      icon: '✅', headerBg: '#1b5e20' },
  Conditional:    { bg: Colors.conditionalBg,  text: Colors.conditional,  icon: '🔵', headerBg: '#0d47a1' },
  'Manual Review':{ bg: Colors.reviewBg,       text: Colors.review,       icon: '⚠️', headerBg: '#e65100' },
  Reject:         { bg: Colors.rejectBg,       text: Colors.reject,       icon: '❌', headerBg: '#b71c1c' },
};

const IMPACT_COLORS = {
  positive: { dot: Colors.positive, badge: Colors.approveBg, badgeText: Colors.approve },
  neutral:  { dot: Colors.neutral,  badge: Colors.reviewBg,  badgeText: Colors.review  },
  negative: { dot: Colors.negative, badge: Colors.rejectBg,  badgeText: Colors.reject  },
};

const fmt = (n: number): string =>
  n >= 100000 ? `${(n / 100000).toFixed(1)}L`
  : n >= 1000  ? `${(n / 1000).toFixed(1)}K`
  : String(n);

const pillStyle = (val: string): { bg: string; text: string } => {
  if (['Good','Normal','Healthy Soil'].includes(val))
    return { bg: Colors.approveBg, text: Colors.approve };
  if (['Moderate','Dry Soil'].includes(val))
    return { bg: Colors.reviewBg, text: Colors.review };
  return { bg: Colors.rejectBg, text: Colors.reject };
};

// ────────────────────────────────────────────────────────────────────────────

const ResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const d   = route.params.data;
  const ds  = DECISION_STYLE[d.decision] || DECISION_STYLE['Manual Review'];
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const FactorRow = ({ factor }: { factor: ScoreFactor }) => {
    const ic = IMPACT_COLORS[factor.impact] || IMPACT_COLORS.neutral;
    return (
      <View style={fStyles.row}>
        <View style={[fStyles.dot, { backgroundColor: ic.dot }]} />
        <View style={fStyles.content}>
          <Text style={fStyles.name}>{factor.factor}</Text>
          <Text style={fStyles.detail}>{factor.detail}</Text>
        </View>
        <View style={[fStyles.badge, { backgroundColor: ic.badge }]}>
          <Text style={[fStyles.badgeText, { color: ic.badgeText }]}>{factor.status}</Text>
        </View>
      </View>
    );
  };

  const MetricPill = ({ val }: { val: string }) => {
    const ps = pillStyle(val);
    return (
      <View style={[mStyles.pill, { backgroundColor: ps.bg }]}>
        <Text style={[mStyles.pillText, { color: ps.text }]}>{val}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={ds.headerBg} />

      {/* ── Score hero section ── */}
      <View style={[styles.hero, { backgroundColor: Colors.soil }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←  New Assessment</Text>
        </TouchableOpacity>

        <Text style={styles.heroLabel}>Credit Score</Text>

        <ScoreRing score={d.score} size={160} />

        {/* Decision badge */}
        <View style={[styles.decisionBadge, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
          <Text style={styles.decisionText}>{ds.icon}  {d.decision}</Text>
        </View>
        <Text style={styles.riskTier}>{d.risk_tier}</Text>
      </View>

      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Financial summary ── */}
        <View style={styles.statsRow}>
          {[
            { val: `₹${fmt(d.loan_limit)}`, label: 'Loan Limit'   },
            { val: `₹${fmt(d.revenue)}`,    label: 'Est. Revenue' },
            { val: d.estimated_yield,        label: 'Est. Yield'   },
          ].map(({ val, label }) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statVal}>{val}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Metrics grid ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>🔬  Farm Analysis</Text>
          <View style={styles.metricsGrid}>

            <View style={mStyles.tile}>
              <Text style={mStyles.name}>NDVI</Text>
              <Text style={mStyles.val}>{d.ndvi}</Text>
              <MetricPill val={d.crop_health} />
            </View>

            <View style={mStyles.tile}>
              <Text style={mStyles.name}>Rainfall (24h)</Text>
              <Text style={mStyles.val}>{d.rainfall_mm} mm</Text>
              <MetricPill val={d.weather_status} />
            </View>

            <View style={mStyles.tile}>
              <Text style={mStyles.name}>Temperature</Text>
              <Text style={mStyles.val}>{d.temp_c}°C</Text>
            </View>

            <View style={mStyles.tile}>
              <Text style={mStyles.name}>Soil Status</Text>
              <Text style={mStyles.val} numberOfLines={1}>{d.soil_status}</Text>
            </View>

          </View>
        </View>

        {/* ── Score factors ── */}
        {d.factors && d.factors.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>📊  Score Factors</Text>
            {d.factors.map((f, i) => <FactorRow key={i} factor={f} />)}
          </View>
        )}

        {/* Eval ID */}
        <Text style={styles.evalId}>Evaluation ID: {d.evaluation_id || '—'}</Text>

      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  hero: {
    paddingTop:     Platform.OS === 'ios' ? 54 : 24,
    paddingBottom:  28,
    alignItems:     'center',
    paddingHorizontal: Spacing.lg,
  },
  backBtn:   { alignSelf: 'flex-start', marginBottom: 12 },
  backText:  { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },
  heroLabel: {
    fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)', marginBottom: 16,
  },
  decisionBadge: {
    marginTop: 18, paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  decisionText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  riskTier: {
    color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 8,
  },
  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 40 },
  statsRow: {
    flexDirection: 'row', gap: 8, marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.offWhite,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    alignItems:      'center',
    ...Shadow.card,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  statVal: {
    fontFamily: 'serif', fontSize: 18, fontWeight: '700',
    color: Colors.leaf,
  },
  statLabel: { fontSize: 10, color: Colors.textLite, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: Colors.offWhite, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    ...Shadow.card, borderWidth: 1, borderColor: Colors.border,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: Colors.leaf,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  evalId: {
    textAlign: 'center', fontSize: 11,
    color: Colors.textHint, marginTop: 4,
  },
});

// Metric tile styles
const mStyles = StyleSheet.create({
  tile: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.cream, borderRadius: Radius.md,
    padding: 12, borderWidth: 1, borderColor: Colors.border,
  },
  name: { fontSize: 11, color: Colors.textLite, letterSpacing: 0.4, marginBottom: 5 },
  val:  { fontSize: 15, fontWeight: '600', color: Colors.textDark },
  pill: {
    alignSelf: 'flex-start', marginTop: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  pillText: { fontSize: 11, fontWeight: '600' },
});

// Factor row styles
const fStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    marginTop: 4, marginRight: 12, flexShrink: 0,
  },
  content: { flex: 1 },
  name:    { fontSize: 13, fontWeight: '600', color: Colors.textDark },
  detail:  { fontSize: 12, color: Colors.textLite, marginTop: 2, lineHeight: 16 },
  badge: {
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 20, marginLeft: 8, alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
});

export default ResultScreen;
