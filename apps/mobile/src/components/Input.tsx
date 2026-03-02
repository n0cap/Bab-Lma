import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fonts, radius } from '../theme';

interface InputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
  inputMode?: TextInputProps['inputMode'];
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry,
  multiline,
  numberOfLines,
  style,
  inputMode,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        inputMode={inputMode}
        style={[styles.input, focused && styles.focused]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label || placeholder || 'Input'}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.dmSans.bold,
    fontSize: 12,
    color: colors.navy,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontFamily: fonts.dmSans.regular,
    fontSize: 14,
    color: colors.navy,
    backgroundColor: colors.surface,
  },
  focused: {
    borderColor: colors.navy,
  },
  error: {
    marginTop: 6,
    fontFamily: fonts.dmSans.regular,
    fontSize: 12,
    color: colors.error,
  },
});
