// src/screens/LoginScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, StatusBar,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { authAPI } from '../api/client';
import { Colors, Spacing, Radius, Shadow } from '../theme/colors';
import { RootStackParamList } from '../types';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Login'> };

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter phone number and password.');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      Alert.alert('Invalid Phone', 'Enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.login({ phone: phone.trim(), password }); // ✅ 'phone' not 'username'
      navigation.replace('MainTabs');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.soil} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.emoji}>🌾</Text>
          <Text style={styles.title}>Varchas</Text>
          <Text style={styles.subtitle}>Welcome back, farmer</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor={Colors.textHint}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            ref={passwordRef}
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor={Colors.textHint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>Login</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>New farmer?  </Text>
            <Text style={[styles.linkText, styles.linkBold]}>Register here →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll:    { flex:1, backgroundColor: Colors.cream },
  container: { flexGrow:1, justifyContent:'center', padding: Spacing.lg },
  header:    { alignItems:'center', marginBottom: Spacing.xl },
  emoji:     { fontSize:48, marginBottom:8 },
  title: {
    fontFamily:'serif', fontSize:36, fontWeight:'900',
    color: Colors.soil, letterSpacing:1,
  },
  subtitle:  { fontSize:14, color: Colors.textLite, marginTop:4 },
  card: {
    backgroundColor: Colors.offWhite, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.card,
    borderWidth:1, borderColor: Colors.border,
  },
  cardTitle: {
    fontSize:20, fontWeight:'700', color: Colors.textDark,
    fontFamily:'serif', marginBottom: Spacing.lg,
  },
  label: {
    fontSize:12, fontWeight:'500', color: Colors.textMid,
    marginBottom:6, letterSpacing:0.3,
  },
  input: {
    borderWidth:1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical:13,
    fontSize:15, color: Colors.textDark, backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  btn: {
    backgroundColor: Colors.soil, borderRadius: Radius.md,
    paddingVertical:16, alignItems:'center',
    marginTop: Spacing.sm, ...Shadow.card,
  },
  btnDisabled: { backgroundColor:'#9a9088' },
  btnText: {
    color: Colors.white, fontSize:16, fontWeight:'700', fontFamily:'serif',
  },
  linkRow: { flexDirection:'row', justifyContent:'center', marginTop: Spacing.lg },
  linkText:  { fontSize:14, color: Colors.textLite },
  linkBold:  { color: Colors.leaf, fontWeight:'600' },
});

export default LoginScreen;
