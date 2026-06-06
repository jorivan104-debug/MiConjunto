import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'

import DashboardScreen from '../screens/DashboardScreen'
import PaymentsScreen from '../screens/PaymentsScreen'
import CommunityScreen from '../screens/CommunityScreen'
import RequestsScreen from '../screens/RequestsScreen'
import ProfileScreen from '../screens/ProfileScreen'
import { colors } from '../theme/tokens'

const Tab = createBottomTabNavigator()

const TabIcon = ({ focused, label }: { focused: boolean; label: string }) => (
  <Text style={{ color: focused ? colors.blue : colors.ink400, fontWeight: focused ? '600' : '400', fontSize: 11 }}>{label}</Text>
)

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.ink400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.ink100,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="🏠" /> }}
      />
      <Tab.Screen
        name="Pagos"
        component={PaymentsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="💳" /> }}
      />
      <Tab.Screen
        name="Comunidad"
        component={CommunityScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="💬" /> }}
      />
      <Tab.Screen
        name="PQRS"
        component={RequestsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="📝" /> }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="👤" /> }}
      />
    </Tab.Navigator>
  )
}
