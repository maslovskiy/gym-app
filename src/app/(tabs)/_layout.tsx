import { router, Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable } from 'react-native';
import { colors } from '../../ui';

function SettingsButton() {
  return (
    <Pressable
      accessibilityLabel="Settings"
      hitSlop={12}
      onPress={() => router.push('/settings')}
      style={{ paddingHorizontal: 16 }}
    >
      <SymbolView name="gearshape" tintColor={colors.tint} size={24} />
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerRight: () => <SettingsButton /> }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <SymbolView name="dumbbell.fill" tintColor={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <SymbolView name="clock.arrow.circlepath" tintColor={color} size={26} />
          ),
        }}
      />
    </Tabs>
  );
}
