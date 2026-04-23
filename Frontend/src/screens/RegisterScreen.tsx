// src/screens/RegisterScreen.tsx
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

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Register'> };

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const phoneRef   = useRef<TextInput>(null);
  const passRef    = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim() || !password || !confirm) {
      Alert.alert('Missing Fields', 'Please fill all fields.');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      Alert.alert('Invalid Phone', 'Enter a valid 10-digit phone number.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({ name: name.trim(), phone: phone.trim(), password });
      Alert.alert('Registered! 🎉', 'Account created successfully.', [
        { text: 'Login Now', onPress: () => navigation.replace('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
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
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.emoji}>👨‍🌾</Text>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>Create your farmer account</Text>
        </View>

        <View style={styles.card}>
          {[
            { label: 'Full Name',        value: name,     setter: setName,     ref: null,        next: phoneRef,   kb: 'default',      secure: false },
            { label: 'Phone Number',     value: phone,    setter: setPhone,    ref: phoneRef,    next: passRef,    kb: 'phone-pad',    secure: false },
            { label: 'Password',         value: password, setter: setPassword, ref: passRef,     next: confirmRef, kb: 'default',      secure: true  },
            { label: 'Confirm Password', value: confirm,  setter: setConfirm,  ref: confirmRef,  next: null,       kb: 'default',      secure: true  },
          ].map(({ label, value, setter, ref, next, kb, secure }) => (
            <View key={label}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                ref={ref as any}
                style={styles.input}
                placeholder={label}
                placeholderTextColor={Colors.textHint}
                value={value}
                onChangeText={setter}
                keyboardType={kb as any}
                secureTextEntry={secure}
                returnKeyType={next ? 'next' : 'done'}
                onSubmitEditing={() => next ? next.current?.focus() : handleRegister()}
                maxLength={label === 'Phone Number' ? 10 : 60}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>Already registered?  </Text>
            <Text style={[styles.linkText, styles.linkBold]}>Login →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: Colors.cream },
  container: { flexGrow: 1, padding: Spacing.lg, paddingTop: Spacing.xl },
  back: { marginBottom: Spacing.md },
  backText: { color: Colors.leaf, fontSize: 15, fontWeight: '500' },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  emoji:    { fontSize: 44, marginBottom: 8 },
  title: {
    fontFamily: 'serif', fontSize: 34, fontWeight: '900',
    color: Colors.soil, letterSpacing: 1,
  },
  subtitle: { fontSize: 14, color: Colors.textLite, marginTop: 4 },
  card: {
    backgroundColor: Colors.offWhite, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  label: {
    fontSize: 12, fontWeight: '500', color: Colors.textMid,
    marginBottom: 6, letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 13,
    fontSize: 15, color: Colors.textDark, backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  btn: {
    backgroundColor: Colors.soil, borderRadius: Radius.md,
    paddingVertical: 16, alignItems: 'center',
    marginTop: Spacing.sm, ...Shadow.card,
  },
  btnDisabled: { backgroundColor: '#9a9088' },
  btnText: {
    color: Colors.white, fontSize: 16, fontWeight: '700', fontFamily: 'serif',
  },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  linkText:  { fontSize: 14, color: Colors.textLite },
  linkBold:  { color: Colors.leaf, fontWeight: '600' },
});

export default RegisterScreen;
