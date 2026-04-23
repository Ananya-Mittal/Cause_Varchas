// src/navigation/AppNavigator.tsx

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator }  from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';

import { authAPI } from '../api/client';
import { Colors }  from '../theme/colors';
import { RootStackParamList, MainTabParamList } from '../types';

import SplashScreen   from '../screens/SplashScreen';
import LoginScreen    from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen     from '../screens/HomeScreen';
import ResultScreen   from '../screens/ResultScreen';
import HistoryScreen  from '../screens/HistoryScreen';
import ProfileScreen  from '../screens/ProfileScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown:   false,
      tabBarStyle: {
        backgroundColor: Colors.soil,
        borderTopColor:  'rgba(255,255,255,0.08)',
        height:          62,
        paddingBottom:   10,
        paddingTop:      4,
      },
      tabBarActiveTintColor:   Colors.leafLite,
      tabBarInactiveTintColor: 'rgba(255,255,255,0.38)',
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarLabel: 'Assess',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🌾</Text>,
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{
        tabBarLabel: 'History',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text>,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
      }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  // null = still loading; once resolved, render navigator
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    authAPI.getStoredToken().then((token) => {
      setInitialRoute(token ? 'MainTabs' : 'Splash');
    });
  }, []);

  // Show a blank loader while AsyncStorage resolves (avoids nav flash)
  if (initialRoute === null) {
    return (
      <View style={{ flex:1, backgroundColor: Colors.soil,
                     alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color={Colors.leafLite} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, gestureEnabled: false }}
      >
        <Stack.Screen name="Splash"   component={SplashScreen}   />
        <Stack.Screen name="Login"    component={LoginScreen}    />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs}       />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ gestureEnabled: true }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
