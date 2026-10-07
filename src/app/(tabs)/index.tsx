import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { getConfig, getDraft, getLastWorkout } from '../../db';
import type { Draft } from '../../domain/draft';
import { program, targetLabel } from '../../domain/program';
import { addDays, todayString, upcomingWorkouts, type PlannedWorkout } from '../../domain/schedule';
import { Button, colors, formatLongDate, formatShortDate, styles } from '../../ui';

function relativeDay(date: string, today: string): string {
  if (date === today) return 'Today';
  if (date === addDays(today, 1)) return 'Tomorrow';
  return formatLongDate(date);
}

export default function Home() {
  const db = useSQLiteContext();
  const [upcoming, setUpcoming] = useState<PlannedWorkout[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const today = todayString();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [config, last, d] = await Promise.all([
          getConfig(db),
          getLastWorkout(db),
          getDraft(db),
        ]);
        setUpcoming(upcomingWorkouts({ config, today: todayString(), lastWorkout: last, count: 6 }));
        setDraft(d);
      })();
    }, [db]),
  );

  if (!upcoming) return <View style={styles.screen} />;
  const [next, ...later] = upcoming;
  const type = draft?.type ?? next.type;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.card, { gap: 4 }]}>
        <Text style={styles.caption}>{draft ? 'In progress' : 'Next workout'}</Text>
        <Text style={[styles.secondary, { fontSize: 20, marginTop: 4 }]}>
          {draft
            ? draft.date === today
              ? 'Started today'
              : `Started ${formatLongDate(draft.date)}`
            : relativeDay(next.date, today)}
        </Text>
        <Text style={{ fontSize: 40, fontWeight: '800', color: colors.label }}>Workout {type}</Text>

        <View style={{ marginTop: 8, gap: 6 }}>
          {program[type].map((e) => (
            <View key={e.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.body}>{e.name}</Text>
              <Text style={styles.secondary}>{targetLabel(e)}</Text>
            </View>
          ))}
        </View>

        <Button
          title={draft ? 'Resume workout' : 'Start workout'}
          style={{ marginTop: 16 }}
          onPress={() => router.push({ pathname: '/workout', params: { type } })}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={[styles.caption, { marginLeft: 16 }]}>Coming up</Text>
        <View style={{ borderRadius: 14, overflow: 'hidden' }}>
          {later.map((w, i) => (
            <View key={w.date}>
              {i > 0 && <View style={styles.separator} />}
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <Text style={styles.body}>{formatShortDate(w.date)}</Text>
                <Text style={styles.secondary}>Workout {w.type}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
