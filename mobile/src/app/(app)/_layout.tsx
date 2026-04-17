import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LayoutDashboard, ClipboardList, BarChart2, User, ListOrdered } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

/**
 * Authenticated tab stack. Mirrors the web's bottom nav at
 * src/app/(app)/layout.tsx but uses a real native tab bar so the
 * ergonomics match every other iOS app the user operates.
 *
 * We guard the stack at the root: if the session ever becomes null
 * (token expired, logout elsewhere), we bounce back to /(auth)/login
 * so the user isn't stuck on a stale screen.
 */
export default function AppLayout() {
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/(auth)/login');
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text3,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          // Let the safe-area provider handle the home-indicator inset
          // — RN's default tab bar already does this, but stating the
          // height keeps the bar visually identical on notched + non-
          // notched iPhones.
          height: 56,
        },
        tabBarLabelStyle: {
          fontFamily: 'Geist',
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Cases',
          tabBarIcon: ({ color, size }) => <ListOrdered color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} />,
        }}
      />
      {/* Inbox exists as a route but is not a tab — staff users reach it
          from a dashboard card. Residents never see it. Hiding here
          keeps the tab bar at 5 native slots and matches the web pattern
          where Inbox lives behind a dashboard CTA, not the bottom nav. */}
      <Tabs.Screen
        name="inbox"
        options={{ href: null }}
      />
      {/* Cases detail route — [id].tsx inside cases/ — same treatment. */}
    </Tabs>
  );
}
