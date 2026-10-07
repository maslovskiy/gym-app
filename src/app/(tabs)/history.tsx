import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { listWorkouts, type WorkoutSummary } from '../../db';
import { colors, formatDayMonth, styles } from '../../ui';

export default function History() {
  const db = useSQLiteContext();
  const [workouts, setWorkouts] = useState<WorkoutSummary[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      listWorkouts(db).then(setWorkouts);
    }, [db]),
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={{ padding: 16 }}
      data={workouts ?? []}
      keyExtractor={(w) => String(w.id)}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        workouts ? (
          <Text style={[styles.secondary, { textAlign: 'center', marginTop: 32 }]}>
            No workouts yet.
          </Text>
        ) : null
      }
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => router.push(`/history/${item.id}`)}
          style={({ pressed }) => [
            styles.row,
            index === 0 && { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
            index === (workouts?.length ?? 0) - 1 && {
              borderBottomLeftRadius: 14,
              borderBottomRightRadius: 14,
            },
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={[styles.body, { flex: 1 }]}>
            {formatDayMonth(item.date)} — Workout {item.type}
          </Text>
          <SymbolView name="checkmark" tintColor={colors.green} size={18} />
          <SymbolView
            name="chevron.right"
            tintColor={colors.tertiary}
            size={14}
            style={{ marginLeft: 12 }}
          />
        </Pressable>
      )}
    />
  );
}
