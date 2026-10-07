import { PlatformColor, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

// iOS semantic colors: follow light/dark mode automatically.
export const colors = {
  background: PlatformColor('systemGroupedBackground'),
  card: PlatformColor('secondarySystemGroupedBackground'),
  field: PlatformColor('tertiarySystemFill'),
  label: PlatformColor('label'),
  secondary: PlatformColor('secondaryLabel'),
  tertiary: PlatformColor('tertiaryLabel'),
  separator: PlatformColor('separator'),
  tint: PlatformColor('systemBlue'),
  green: PlatformColor('systemGreen'),
  red: PlatformColor('systemRed'),
  onTint: '#FFFFFF',
};

function fromDateString(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// "Wednesday, October 9"
export function formatLongDate(date: string): string {
  return fromDateString(date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// "Wed, Oct 9"
export function formatShortDate(date: string): string {
  return fromDateString(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// "Oct 9"
export function formatDayMonth(date: string): string {
  return fromDateString(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function Button(props: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'plain' | 'destructive';
  style?: ViewStyle;
}) {
  const variant = props.variant ?? 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: colors.tint },
        variant !== 'primary' && { backgroundColor: colors.card },
        pressed && { opacity: 0.6 },
        props.style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          {
            color:
              variant === 'primary'
                ? colors.onTint
                : variant === 'destructive'
                  ? colors.red
                  : colors.tint,
          },
        ]}
      >
        {props.title}
      </Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16 },
  caption: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.secondary,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.label },
  body: { fontSize: 17, color: colors.label },
  secondary: { fontSize: 15, color: colors.secondary },
  button: {
    minHeight: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: { fontSize: 18, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: 16 },
});
