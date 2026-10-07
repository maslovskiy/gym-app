import { Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Image, ScrollView, Text, View } from 'react-native';
import { findExercise, targetLabel } from '../../domain/program';
import { colors, styles } from '../../ui';

export default function ExerciseInfo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = findExercise(id);
  if (!exercise) return <View style={styles.screen} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: exercise.name }} />
      <View
        style={[
          styles.card,
          { aspectRatio: 4 / 3, padding: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
        ]}
      >
        {exercise.image ? (
          <Image source={exercise.image} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        ) : (
          <SymbolView
            name={exercise.kind === 'cardio' ? 'figure.run' : 'figure.strengthtraining.traditional'}
            tintColor={colors.tertiary}
            size={96}
          />
        )}
      </View>
      <View style={{ gap: 4 }}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={styles.secondary}>{targetLabel(exercise)}</Text>
      </View>
      <View style={[styles.card, { gap: 4 }]}>
        <Text style={styles.caption}>Primary muscles</Text>
        <Text style={styles.body}>{exercise.muscle}</Text>
      </View>
      <View style={[styles.card, { gap: 4 }]}>
        <Text style={styles.caption}>How to</Text>
        <Text style={[styles.body, { lineHeight: 24 }]}>{exercise.howTo}</Text>
      </View>
    </ScrollView>
  );
}
