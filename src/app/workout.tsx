import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { clearDraft, getDraft, getPreviousLogs, saveDraft, saveWorkout } from '../db';
import {
  draftToExercises,
  newDraft,
  type Draft,
  type DraftEntry,
  type PreviousLog,
} from '../domain/draft';
import { program, targetLabel, type Exercise } from '../domain/program';
import { todayString, type WorkoutType } from '../domain/schedule';
import { formatKg, formatSets, suggestWeight } from '../domain/suggest';
import { Button, colors, styles } from '../ui';

const ACCESSORY_ID = 'workout-keyboard';

// Keeps the order of every number field so the keyboard's "Next" button
// can jump straight to the next one without reaching for the screen.
function useFieldChain() {
  const fields = useRef(new Map<string, TextInput>());
  const order = useRef<string[]>([]);
  const current = useRef<string | null>(null);
  return {
    register: (key: string) => (input: TextInput | null) => {
      if (input) fields.current.set(key, input);
      else fields.current.delete(key);
    },
    setOrder: (keys: string[]) => {
      order.current = keys;
    },
    onFocus: (key: string) => () => {
      current.current = key;
    },
    next: () => {
      const i = current.current ? order.current.indexOf(current.current) : -1;
      const nextKey = order.current[i + 1];
      if (nextKey) fields.current.get(nextKey)?.focus();
      else Keyboard.dismiss();
    },
  };
}

type Chain = ReturnType<typeof useFieldChain>;

export default function Workout() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ type: WorkoutType }>();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [previous, setPrevious] = useState<Record<string, PreviousLog>>({});
  const chain = useFieldChain();

  useEffect(() => {
    (async () => {
      const prev = await getPreviousLogs(db);
      setPrevious(prev);
      const existing = await getDraft(db);
      setDraft(
        existing ??
          newDraft(params.type === 'B' ? 'B' : 'A', todayString(), (id) => prev[id] ?? null),
      );
    })();
  }, [db, params.type]);

  // Save every keystroke so a killed app never loses a workout.
  useEffect(() => {
    if (draft) saveDraft(db, draft);
  }, [db, draft]);

  if (!draft) return <View style={styles.screen} />;
  const exercises = program[draft.type];

  chain.setOrder(
    exercises.flatMap((e) =>
      e.kind === 'cardio'
        ? [`${e.id}:duration`, `${e.id}:distance`]
        : draft.entries[e.id].sets.flatMap((_, i) => [`${e.id}:${i}:w`, `${e.id}:${i}:r`]),
    ),
  );

  const updateEntry = (id: string, update: (entry: DraftEntry) => DraftEntry) =>
    setDraft((d) => (d ? { ...d, entries: { ...d.entries, [id]: update(d.entries[id]) } } : d));

  const finish = async () => {
    const logged = draftToExercises(draft, exercises);
    if (logged.length === 0) {
      Alert.alert('Nothing logged yet', 'Enter reps for at least one set first.');
      return;
    }
    await saveWorkout(db, { date: draft.date, type: draft.type, exercises: logged });
    router.back();
  };

  const discard = () =>
    Alert.alert('Discard workout?', 'Everything entered in this workout will be lost.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await clearDraft(db);
          router.back();
        },
      },
    ]);

  return (
    <>
      <Stack.Screen
        options={{
          title: `Workout ${draft.type}`,
          headerRight: () => (
            <Pressable onPress={discard} hitSlop={12}>
              <Text style={{ color: colors.red, fontSize: 17 }}>Discard</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: 48 }]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {exercises.map((e) => (
          <View key={e.id} style={[styles.card, { gap: 10 }]}>
            <ExerciseHeader exercise={e} />
            {e.kind === 'cardio' ? (
              <CardioInputs
                exercise={e}
                entry={draft.entries[e.id]}
                previous={previous[e.id]}
                chain={chain}
                onChange={(patch) => updateEntry(e.id, (entry) => ({ ...entry, ...patch }))}
              />
            ) : (
              <StrengthInputs
                exercise={e}
                entry={draft.entries[e.id]}
                previous={previous[e.id]}
                chain={chain}
                onChangeSet={(i, patch) =>
                  updateEntry(e.id, (entry) => ({
                    ...entry,
                    sets: entry.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)),
                  }))
                }
              />
            )}
          </View>
        ))}
        <Button title="Finish workout" onPress={finish} />
      </ScrollView>

      <InputAccessoryView nativeID={ACCESSORY_ID}>
        <View style={local.accessory}>
          <Pressable onPress={Keyboard.dismiss} hitSlop={8} style={local.accessoryButton}>
            <Text style={{ color: colors.tint, fontSize: 17 }}>Done</Text>
          </Pressable>
          <Pressable onPress={chain.next} hitSlop={8} style={local.accessoryButton}>
            <Text style={{ color: colors.tint, fontSize: 17, fontWeight: '600' }}>Next</Text>
          </Pressable>
        </View>
      </InputAccessoryView>
    </>
  );
}

function ExerciseHeader({ exercise }: { exercise: Exercise }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={[styles.secondary, { fontSize: 17 }]}>{targetLabel(exercise)}</Text>
      </View>
      <Pressable
        accessibilityLabel={`How to do ${exercise.name}`}
        hitSlop={12}
        onPress={() => router.push(`/exercise/${exercise.id}`)}
        style={{ padding: 4 }}
      >
        <SymbolView name="info.circle" tintColor={colors.tint} size={26} />
      </Pressable>
    </View>
  );
}

function StrengthInputs(props: {
  exercise: Extract<Exercise, { kind: 'strength' }>;
  entry: DraftEntry;
  previous: PreviousLog | undefined;
  chain: Chain;
  onChangeSet: (index: number, patch: { weight?: string; reps?: string }) => void;
}) {
  const { exercise: e, entry, previous, chain } = props;
  const prevSets = previous?.sets ?? [];
  const suggestion = suggestWeight(prevSets, e);

  return (
    <>
      {prevSets.length > 0 ? (
        <View>
          <Text style={styles.secondary}>Last time: {formatSets(prevSets)}</Text>
          {suggestion !== null && (
            <Text style={[styles.secondary, { color: colors.tertiary, marginTop: 2 }]}>
              Consider {formatKg(suggestion)} if this felt comfortable.
            </Text>
          )}
        </View>
      ) : (
        <Text style={styles.secondary}>First time — pick a comfortable weight.</Text>
      )}

      {entry.sets.map((set, i) => {
        // Tapping the check copies last time's reps (or the target) in one tap.
        const repsHint = String(prevSets[i]?.reps ?? e.repsMin);
        const done = set.reps !== '';
        return (
          <View key={i} style={local.setRow}>
            <Text style={local.setLabel}>{i + 1}</Text>
            <NumberField
              chain={chain}
              fieldKey={`${e.id}:${i}:w`}
              value={set.weight}
              placeholder="0"
              unit="kg"
              decimal
              onChangeText={(weight) => props.onChangeSet(i, { weight })}
            />
            <NumberField
              chain={chain}
              fieldKey={`${e.id}:${i}:r`}
              value={set.reps}
              placeholder={repsHint}
              unit="reps"
              onChangeText={(reps) => props.onChangeSet(i, { reps })}
            />
            <Pressable
              accessibilityLabel={done ? `Clear set ${i + 1}` : `Log set ${i + 1} as ${repsHint} reps`}
              hitSlop={8}
              onPress={() => props.onChangeSet(i, { reps: done ? '' : repsHint })}
              style={local.check}
            >
              <SymbolView
                name={done ? 'checkmark.circle.fill' : 'circle'}
                tintColor={done ? colors.green : colors.tertiary}
                size={34}
              />
            </Pressable>
          </View>
        );
      })}
    </>
  );
}

function CardioInputs(props: {
  exercise: Extract<Exercise, { kind: 'cardio' }>;
  entry: DraftEntry;
  previous: PreviousLog | undefined;
  chain: Chain;
  onChange: (patch: { duration?: string; distance?: string }) => void;
}) {
  const { exercise: e, entry, previous, chain } = props;
  const last = [
    previous?.durationMin != null && `${previous.durationMin} min`,
    previous?.distanceKm != null && `${previous.distanceKm} km`,
  ].filter(Boolean);
  return (
    <>
      {last.length > 0 && <Text style={styles.secondary}>Last time: {last.join(' · ')}</Text>}
      <View style={local.setRow}>
        <NumberField
          chain={chain}
          fieldKey={`${e.id}:duration`}
          value={entry.duration}
          placeholder={String(e.minutesMin)}
          unit="min"
          decimal
          onChangeText={(duration) => props.onChange({ duration })}
        />
        <NumberField
          chain={chain}
          fieldKey={`${e.id}:distance`}
          value={entry.distance}
          placeholder="—"
          unit="km"
          decimal
          onChangeText={(distance) => props.onChange({ distance })}
        />
      </View>
    </>
  );
}

function NumberField(props: {
  chain: Chain;
  fieldKey: string;
  value: string;
  placeholder: string;
  unit: string;
  decimal?: boolean;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={local.field}>
      <TextInput
        ref={props.chain.register(props.fieldKey)}
        onFocus={props.chain.onFocus(props.fieldKey)}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.tertiary}
        keyboardType={props.decimal ? 'decimal-pad' : 'number-pad'}
        inputAccessoryViewID={ACCESSORY_ID}
        selectTextOnFocus
        style={local.input}
      />
      <Text style={styles.secondary}>{props.unit}</Text>
    </View>
  );
}

const local = StyleSheet.create({
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  setLabel: { width: 18, fontSize: 17, fontWeight: '600', color: colors.secondary },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.field,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: colors.label,
    paddingVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  check: { width: 44, height: 52, alignItems: 'center', justifyContent: 'center' },
  accessory: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  accessoryButton: { paddingHorizontal: 20, paddingVertical: 12 },
});
