import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { getConfig, resetAll, setConfig } from '../db';
import { addDays, todayString, type ScheduleConfig } from '../domain/schedule';
import { Button, colors, formatShortDate, styles } from '../ui';

function Stepper(props: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={[styles.card, { gap: 8 }]}>
      <Text style={styles.caption}>{props.label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <StepButton icon="minus" label={`Decrease ${props.label}`} onPress={props.onMinus} />
        <Text style={[styles.body, { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '600' }]}>
          {props.value}
        </Text>
        <StepButton icon="plus" label={`Increase ${props.label}`} onPress={props.onPlus} />
      </View>
    </View>
  );
}

function StepButton(props: { icon: 'minus' | 'plus'; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={props.label}
      onPress={props.onPress}
      style={({ pressed }) => ({
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.field,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <SymbolView name={props.icon} tintColor={colors.tint} size={22} />
    </Pressable>
  );
}

export default function Settings() {
  const db = useSQLiteContext();
  const [config, setLocalConfig] = useState<ScheduleConfig | null>(null);

  useEffect(() => {
    getConfig(db).then(setLocalConfig);
  }, [db]);

  if (!config) return <View style={styles.screen} />;

  const update = (next: ScheduleConfig) => {
    setLocalConfig(next);
    setConfig(db, next);
  };

  const reset = () =>
    Alert.alert('Reset all data?', 'This deletes every workout and setting on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await resetAll(db);
          router.back();
        },
      },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stepper
        label="Training start date"
        value={formatShortDate(config.startDate)}
        onMinus={() => update({ ...config, startDate: addDays(config.startDate, -1) })}
        onPlus={() => update({ ...config, startDate: addDays(config.startDate, 1) })}
      />
      {config.startDate !== todayString() && (
        <Button
          title="Start from today"
          variant="plain"
          onPress={() => update({ ...config, startDate: todayString() })}
        />
      )}
      <Stepper
        label="Train every"
        value={`${config.intervalDays} ${config.intervalDays === 1 ? 'day' : 'days'}`}
        onMinus={() => update({ ...config, intervalDays: Math.max(1, config.intervalDays - 1) })}
        onPlus={() => update({ ...config, intervalDays: Math.min(7, config.intervalDays + 1) })}
      />
      <Text style={[styles.secondary, { paddingHorizontal: 4 }]}>
        Training days repeat every {config.intervalDays} days from the start date. Workouts
        alternate A and B based on what you last completed.
      </Text>
      <Button title="Reset local data" variant="destructive" onPress={reset} style={{ marginTop: 24 }} />
    </ScrollView>
  );
}
