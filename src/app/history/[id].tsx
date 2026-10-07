import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { deleteWorkout, getWorkout, type WorkoutRecord } from '../../db';
import { formatKg } from '../../domain/suggest';
import { colors, formatLongDate, styles } from '../../ui';

export default function WorkoutDetail() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<WorkoutRecord | null>(null);

  useEffect(() => {
    getWorkout(db, Number(id)).then(setWorkout);
  }, [db, id]);

  if (!workout) return <View style={styles.screen} />;

  const remove = () =>
    Alert.alert('Delete this workout?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWorkout(db, workout.id);
          router.back();
        },
      },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: `Workout ${workout.type}`,
          headerRight: () => (
            <Pressable onPress={remove} hitSlop={12}>
              <Text style={{ color: colors.red, fontSize: 17 }}>Delete</Text>
            </Pressable>
          ),
        }}
      />
      <Text style={styles.title}>{formatLongDate(workout.date)}</Text>
      {workout.exercises.map((e) => (
        <View key={e.exerciseId} style={[styles.card, { gap: 6 }]}>
          <Text style={[styles.body, { fontWeight: '600' }]}>{e.name}</Text>
          {e.sets.map((s, i) => (
            <Text key={i} style={[styles.secondary, { fontVariant: ['tabular-nums'] }]}>
              Set {i + 1}: {formatKg(s.weightKg)} × {s.reps}
            </Text>
          ))}
          {e.durationMin != null && <Text style={styles.secondary}>{e.durationMin} min</Text>}
          {e.distanceKm != null && <Text style={styles.secondary}>{e.distanceKm} km</Text>}
        </View>
      ))}
    </ScrollView>
  );
}
