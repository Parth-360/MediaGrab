import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS }   from '../theme/colors';

import HomeScreen         from '../screens/HomeScreen';
import YouTubeScreen      from '../screens/YouTubeScreen';
import SpotifyScreen      from '../screens/SpotifyScreen';
import YouTubeMusicScreen from '../screens/YouTubeMusicScreen';
import DownloadsScreen    from '../screens/DownloadsScreen';
import SettingsScreen     from '../screens/SettingsScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor:  COLORS.surface,
          borderTopColor:   COLORS.border,
          borderTopWidth:   1,
          height:           65,
          paddingBottom:    10,
          paddingTop:       8,
          elevation:        20,
        },
        tabBarActiveTintColor:   COLORS.tabActive,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarLabelStyle:        { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Home:         focused ? 'home'           : 'home-outline',
            YouTube:      'logo-youtube',
            'YT Music':   focused ? 'musical-note'   : 'musical-note-outline',
            Spotify:      focused ? 'musical-notes'  : 'musical-notes-outline',
            Downloads:    focused ? 'download'        : 'download-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen} />
      <Tab.Screen
        name="YouTube"
        component={YouTubeScreen}
        options={{ tabBarActiveTintColor: '#FF0000' }}
      />
      <Tab.Screen
        name="YT Music"
        component={YouTubeMusicScreen}
        options={{ tabBarActiveTintColor: '#FF0000' }}
      />
      <Tab.Screen
        name="Spotify"
        component={SpotifyScreen}
        options={{ tabBarActiveTintColor: '#1DB954' }}
      />
      <Tab.Screen name="Downloads" component={DownloadsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
