// src/screens/HistoryScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar,
  TouchableOpacity, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { creditAPI } from '../api/client';
import { Colors, Spacing, Radius, Shadow } from '../theme/colors';
import { HistoryItem } from '../types';

const DECISION_COLOR: Record<string, string> = {
  Approve:        Colors.approve,
  Conditional:    Colors.conditional,
  'Manual Review':Colors.review,
  Reject:         Colors.reject,
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
};

const HistoryScreen = () => {
  const [items,     setItems]     = useState<HistoryItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState('');

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await creditAPI.getHistory(20);
      setItems(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload when tab comes into focus
  useFocusEffect(useCallback(() => { load(); }, []));

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const decColor = DECISION_COLOR[item.decision] || Colors.textMid;
    return (
      <View style={styles.item}>
        <View style={[styles.scoreCircle, { borderColor: decColor }]}>
          <Text style={[styles.scoreNum, { color: decColor }]}>{item.score ?? '—'}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.crop}>{item.crop?.charAt(0).toUpperCase() + item.crop?.slice(1) || '—'}</Text>
          <Text style={styles.coords}>
            {item.lat?.toFixed(3)}, {item.lon?.toFixed(3)}
          </Text>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[styles.decisionTag, { backgroundColor: decColor + '20' }]}>
          <Text style={[styles.decisionText, { color: decColor }]}>{item.decision}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.soil} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋  Evaluations</Text>
        <TouchableOpacity onPress={() => load(true)}>
          <Text style={styles.refreshBtn}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.leaf} />
          <Text style={styles.loadingText}>Loading history…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={Colors.leaf}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyText}>No evaluations yet</Text>
              <Text style={styles.emptySubText}>
                Calculate your first credit score from the Assess tab
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    backgroundColor: Colors.soil,
    paddingHorizontal: Spacing.lg,
    paddingTop:      Platform.OS === 'ios' ? 54 : 16,
    paddingBottom:   18,
  },
  headerTitle: {
    fontFamily: 'serif', fontSize: 22, fontWeight: '800',
    color: Colors.white,
  },
  refreshBtn: { color: Colors.leafLite, fontSize: 14, fontWeight: '500' },
  listContent: { padding: Spacing.md, paddingBottom: 40 },
  item: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.offWhite,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginBottom:    10,
    ...Shadow.card,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             12,
  },
  scoreCircle: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: {
    fontFamily: 'serif', fontSize: 18, fontWeight: '800',
  },
  itemInfo: { flex: 1 },
  crop: {
    fontSize: 15, fontWeight: '600', color: Colors.textDark,
  },
  coords: {
    fontSize: 12, color: Colors.textLite, marginTop: 2,
  },
  date: {
    fontSize: 11, color: Colors.textHint, marginTop: 2,
  },
  decisionTag: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  decisionText: { fontSize: 11, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  loadingText: { color: Colors.textLite, marginTop: Spacing.md, fontSize: 14 },
  errorText:   { color: Colors.reject, fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: Spacing.md, backgroundColor: Colors.leaf,
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.full,
  },
  retryText:   { color: Colors.white, fontWeight: '600' },
  emptyEmoji:  { fontSize: 52, marginBottom: Spacing.md },
  emptyText:   { fontSize: 18, fontWeight: '700', color: Colors.textDark, fontFamily: 'serif' },
  emptySubText:{ fontSize: 14, color: Colors.textLite, textAlign: 'center', marginTop: 8 },
});

export default HistoryScreen;
