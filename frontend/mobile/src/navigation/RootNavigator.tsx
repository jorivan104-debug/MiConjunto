import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useAuthStore } from '../store/authStore'
import { colors } from '../theme/tokens'
import LoginScreen from '../screens/LoginScreen'
import TwoFactorScreen from '../screens/TwoFactorScreen'
import PasswordChangeScreen from '../screens/PasswordChangeScreen'
import MainTabs from './MainTabs'

const Stack = createNativeStackNavigator()

export default function RootNavigator() {
  const { isAuthenticated, initialized, user, preAuthToken } = useAuthStore()

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator color={colors.blue} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            {preAuthToken && <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />}
          </>
        ) : user?.needs_password_change || user?.must_change_password ? (
          <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
