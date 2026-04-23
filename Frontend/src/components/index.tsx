import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Shadow, Radius, Spacing } from '../theme/colors';
import { ScoreFactor } from '../types';


// ─────────────────────────────────────────────
// 1. METRIC CARD
// ─────────────────────────────────────────────

interface MetricProps {
  label: string;
  value: string;
  pill?: string;
  pillType?: 'good' | 'moderate' | 'poor' | 'normal' | 'drought' | 'flood' | 'neutral';
}

const pillConfig = {
  good:     { bg: Colors.approveBg, text: Colors.approve },
  normal:   { bg: Colors.approveBg, text: Colors.approve },
  moderate: { bg: Colors.reviewBg,  text: Colors.review },
  drought:  { bg: Colors.reviewBg,  text: Colors.review },
  poor:     { bg: Colors.rejectBg,  text: Colors.reject },
  flood:    { bg: Colors.rejectBg,  text: Colors.reject },
  neutral:  { bg: '#f0f0f0',        text: Colors.textMid },
};

export const MetricCard: React.FC<MetricProps> = ({
  label,
  value,
  pill,
  pillType = 'neutral',
}) => {
  const pc = pillConfig[pillType];

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>

      {pill ? (
        <View style={[styles.pill, { backgroundColor: pc.bg }]}>
          <Text style={[styles.pillText, { color: pc.text }]}>
            {pill}
          </Text>
        </View>
      ) : null}
    </View>
  );
};


// ─────────────────────────────────────────────
// 2. STATUS PILL
// ─────────────────────────────────────────────

interface PillProps {
  text: string;
  type?: 'approve' | 'reject' | 'review' | 'conditional';
}

const decisionConfig = {
  approve:     { bg: Colors.approveBg,     text: Colors.approve,     icon: '✅' },
  reject:      { bg: Colors.rejectBg,      text: Colors.reject,      icon: '❌' },
  review:      { bg: Colors.reviewBg,      text: Colors.review,      icon: '⚠️' },
  conditional: { bg: Colors.conditionalBg, text: Colors.conditional, icon: '🔵' },
};

export const StatusPill: React.FC<PillProps> = ({
  text,
  type = 'review',
}) => {
  const cfg = decisionConfig[type];

  return (
    <View style={[pillStyles.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[pillStyles.text, { color: cfg.text }]}>
        {cfg.icon} {text}
      </Text>
    </View>
  );
};


// ─────────────────────────────────────────────
// 3. FACTOR ITEM
// ─────────────────────────────────────────────

const impactDot = {
  positive: Colors.approve,
  neutral:  Colors.textMid,
  negative: Colors.reject,
};

const impactBadge = {
  positive: { bg: Colors.approveBg, text: Colors.approve },
  neutral:  { bg: Colors.reviewBg,  text: Colors.review },
  negative: { bg: Colors.rejectBg,  text: Colors.reject },
};

export const FactorItem: React.FC<{ factor: ScoreFactor }> = ({
  factor,
}) => {
  const dotColor = impactDot[factor.impact] || Colors.textMid;
  const badge = impactBadge[factor.impact] || impactBadge.neutral;

  return (
    <View style={factorStyles.row}>
      <View style={[factorStyles.dot, { backgroundColor: dotColor }]} />

      <View style={factorStyles.content}>
        <Text style={factorStyles.name}>{factor.factor}</Text>
        <Text style={factorStyles.detail}>{factor.detail}</Text>
      </View>

      <View style={[factorStyles.badge, { backgroundColor: badge.bg }]}>
        <Text style={[factorStyles.badgeText, { color: badge.text }]}>
          {factor.status}
        </Text>
      </View>
    </View>
  );
};


// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.offWhite,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: 11,
    color: Colors.textLite,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
  pill: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 30,
    alignSelf: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});

const factorStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  detail: {
    fontSize: 12,
    color: Colors.textLite,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});