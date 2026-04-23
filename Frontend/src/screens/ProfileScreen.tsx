// src/screens/ProfileScreen.tsx
// Farmer profile page with stats + logout

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, StatusBar, Platform, Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { authAPI, creditAPI } from '../api/client';
import { Colors, Spacing, Radius, Shadow } from '../theme/colors';
import { RootStackParamList, HistoryItem } from '../types';

type Props = { navigation: StackNavigationProp<RootStackParamList> };

interface ProfileStats {
  totalEvals:   number;
  avgScore:     number;
  approveCount: number;
  rejectCount:  number;
  bestScore:    number;
  topCrop:      string;
}

const AVATARS = ['👨‍🌾','👩‍🌾','🧑‍🌾'];

function computeStats(items: HistoryItem[]): ProfileStats {
  if (!items.length) return { totalEvals:0, avgScore:0, approveCount:0, rejectCount:0, bestScore:0, topCrop:'—' };

  const scores   = items.map(i => i.score ?? 0);
  const avgScore = Math.round(scores.reduce((a,b)=>a+b,0) / scores.length);
  const bestScore = Math.max(...scores);

  const approveCount = items.filter(i => i.decision === 'Approve').length;
  const rejectCount  = items.filter(i => i.decision === 'Reject').length;

  const cropCount: Record<string,number> = {};
  items.forEach(i => { if (i.crop) cropCount[i.crop] = (cropCount[i.crop]||0)+1; });
  const topCrop = Object.entries(cropCount).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? '—';

  return { totalEvals: items.length, avgScore, approveCount, rejectCount, bestScore, topCrop };
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [farmerName, setFarmerName] = useState('Farmer');
  const [phone,      setPhone]      = useState('');
  const [stats,      setStats]      = useState<ProfileStats | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const avatarIndex = farmerName.charCodeAt(0) % AVATARS.length;

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [name, storedPhone, history] = await Promise.all([
        authAPI.getStoredName(),
        authAPI.getStoredPhone(),
        creditAPI.getHistory(50),
      ]);
      setFarmerName(name ?? 'Farmer');
      setPhone(storedPhone ?? '');
      setStats(computeStats(history));
    } catch {
      setStats(computeStats([]));
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue:1, duration:450, useNativeDriver:true }).start();
    }
  };

  useFocusEffect(useCallback(() => { loadProfile(); }, []));

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await authAPI.logout();
            // Navigate back to Login, clear stack
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ],
    );
  };

  const scoreRingColor = (score: number) =>
    score >= 75 ? Colors.approve : score >= 50 ? Colors.wheat : Colors.reject;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.soil} />

      {/* ── Header banner ── */}
      <View style={styles.banner}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{AVATARS[avatarIndex]}</Text>
        </View>
        <Text style={styles.name}>{farmerName}</Text>
        {phone ? <Text style={styles.phone}>📱 +91 {phone}</Text> : null}
        <View style={styles.memberBadge}>
          <Text style={styles.memberText}>🌱 Varchas Member</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.leaf} />
        </View>
      ) : (
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Stats grid ── */}
          {stats && (
            <>
              <Text style={styles.sectionLabel}>📊  Your Farm Stats</Text>
              <View style={styles.statsGrid}>
                <StatTile title="Assessments" value={String(stats.totalEvals)} icon="📋" />
                <StatTile title="Avg Score"   value={String(stats.avgScore)}   icon="🎯"
                  valueColor={scoreRingColor(stats.avgScore)} />
                <StatTile title="Best Score"  value={String(stats.bestScore)}  icon="🏆"
                  valueColor={scoreRingColor(stats.bestScore)} />
                <StatTile title="Approvals"   value={String(stats.approveCount)} icon="✅"
                  valueColor={Colors.approve} />
                <StatTile title="Rejections"  value={String(stats.rejectCount)}  icon="❌"
                  valueColor={Colors.reject} />
                <StatTile title="Top Crop"    value={stats.topCrop.charAt(0).toUpperCase()+stats.topCrop.slice(1)} icon="🌾" />
              </View>
            </>
          )}

          {/* ── Approval rate bar ── */}
          {stats && stats.totalEvals > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Approval Rate</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, {
                  width: `${(stats.approveCount / stats.totalEvals) * 100}%` as any,
                  backgroundColor: Colors.leaf,
                }]} />
              </View>
              <Text style={styles.barLabel}>
                {Math.round((stats.approveCount / stats.totalEvals) * 100)}% of applications approved
              </Text>
            </View>
          )}

          {/* ── Account section ── */}
          <Text style={styles.sectionLabel}>⚙️  Account</Text>

          <View style={styles.menuCard}>
            <MenuItem icon="🔒" label="Change Password" onPress={() =>
              Alert.alert('Coming Soon', 'Password change will be available in the next update.')} />
            <View style={styles.menuDivider} />
            <MenuItem icon="📞" label="Contact Support" onPress={() =>
              Alert.alert('Support', 'Email us at support@varchas.in')} />
            <View style={styles.menuDivider} />
            <MenuItem icon="📄" label="Privacy Policy" onPress={() =>
              Alert.alert('Privacy', 'Your data is stored securely and never shared.')} />
            <View style={styles.menuDivider} />
            <MenuItem icon="ℹ️" label="App Version" value="v2.0.0" onPress={() => {}} />
          </View>

          {/* ── Logout ── */}
          <TouchableOpacity
            style={[styles.logoutBtn, loggingOut && { opacity: 0.6 }]}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.85}
          >
            {loggingOut
              ? <ActivityIndicator color={Colors.reject} />
              : <>
                  <Text style={styles.logoutIcon}>🚪</Text>
                  <Text style={styles.logoutText}>Sign Out</Text>
                </>
            }
          </TouchableOpacity>

          <Text style={styles.footer}>Varchas Agri Credit AI · v2.0.0</Text>
        </Animated.ScrollView>
      )}
    </View>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StatTile = ({
  title, value, icon, valueColor,
}: { title:string; value:string; icon:string; valueColor?:string }) => (
  <View style={tileStyles.tile}>
    <Text style={tileStyles.icon}>{icon}</Text>
    <Text style={[tileStyles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    <Text style={tileStyles.title}>{title}</Text>
  </View>
);

const MenuItem = ({
  icon, label, value, onPress,
}: { icon:string; label:string; value?:string; onPress:()=>void }) => (
  <TouchableOpacity style={menuStyles.item} onPress={onPress} activeOpacity={0.7}>
    <Text style={menuStyles.icon}>{icon}</Text>
    <Text style={menuStyles.label}>{label}</Text>
    {value
      ? <Text style={menuStyles.value}>{value}</Text>
      : <Text style={menuStyles.arrow}>›</Text>
    }
  </TouchableOpacity>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex:1, backgroundColor: Colors.cream },
  center:      { flex:1, alignItems:'center', justifyContent:'center' },
  scrollContent:{ padding: Spacing.md, paddingBottom: 48 },

  banner: {
    backgroundColor:  Colors.soil,
    alignItems:       'center',
    paddingTop:       Platform.OS==='ios' ? 60 : 28,
    paddingBottom:    32,
    paddingHorizontal: Spacing.lg,
  },
  avatar: {
    width:74, height:74, borderRadius:37,
    backgroundColor:'rgba(255,255,255,0.12)',
    alignItems:'center', justifyContent:'center',
    marginBottom: 12,
    borderWidth:2, borderColor:'rgba(255,255,255,0.2)',
  },
  avatarText:  { fontSize:38 },
  name: {
    fontFamily:'serif', fontSize:26, fontWeight:'900',
    color: Colors.white, letterSpacing:0.5,
  },
  phone: { fontSize:13, color:'rgba(255,255,255,0.55)', marginTop:4 },
  memberBadge: {
    marginTop:12, paddingHorizontal:16, paddingVertical:5,
    backgroundColor:'rgba(108,191,126,0.2)',
    borderRadius:Radius.full,
    borderWidth:1, borderColor:'rgba(108,191,126,0.35)',
  },
  memberText: { fontSize:12, color: Colors.leafLite, fontWeight:'600' },

  sectionLabel: {
    fontSize:11, fontWeight:'600', color: Colors.leaf,
    letterSpacing:1.5, textTransform:'uppercase',
    marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  statsGrid: {
    flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom: Spacing.md,
  },

  card: {
    backgroundColor: Colors.offWhite, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    ...Shadow.card, borderWidth:1, borderColor: Colors.border,
  },
  cardTitle: {
    fontSize:13, fontWeight:'600', color: Colors.textDark, marginBottom:10,
  },
  barTrack: {
    height:8, backgroundColor:'rgba(200,187,168,0.4)',
    borderRadius:4, overflow:'hidden',
  },
  barFill: { height:'100%', borderRadius:4 },
  barLabel: { fontSize:12, color: Colors.textLite, marginTop:6 },

  menuCard: {
    backgroundColor: Colors.offWhite, borderRadius: Radius.lg,
    ...Shadow.card, borderWidth:1, borderColor: Colors.border,
    marginBottom: Spacing.md, overflow:'hidden',
  },
  menuDivider: { height:1, backgroundColor: Colors.divider, marginLeft:50 },

  logoutBtn: {
    flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10,
    borderWidth:1.5, borderColor: Colors.reject,
    borderRadius: Radius.md, paddingVertical:16,
    backgroundColor:'rgba(192,57,43,0.04)',
    marginBottom: Spacing.lg,
  },
  logoutIcon: { fontSize:18 },
  logoutText: { fontSize:16, fontWeight:'700', color: Colors.reject },
  footer: {
    textAlign:'center', fontSize:11, color: Colors.textHint, paddingBottom:8,
  },
});

const tileStyles = StyleSheet.create({
  tile: {
    width:'30%', flexGrow:1,
    backgroundColor: Colors.offWhite, borderRadius: Radius.md,
    padding:14, alignItems:'center',
    ...Shadow.card, borderWidth:1, borderColor: Colors.border,
  },
  icon:  { fontSize:22, marginBottom:6 },
  value: {
    fontFamily:'serif', fontSize:22, fontWeight:'800',
    color: Colors.soil,
  },
  title: { fontSize:11, color: Colors.textLite, marginTop:3, textAlign:'center' },
});

const menuStyles = StyleSheet.create({
  item: {
    flexDirection:'row', alignItems:'center',
    paddingHorizontal: Spacing.md, paddingVertical:15, gap:12,
  },
  icon:  { fontSize:18, width:24, textAlign:'center' },
  label: { flex:1, fontSize:15, color: Colors.textDark },
  value: { fontSize:14, color: Colors.textLite },
  arrow: { fontSize:20, color: Colors.textHint },
});

export default ProfileScreen;
