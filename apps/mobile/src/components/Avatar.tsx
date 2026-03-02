import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

interface AvatarProps {
  initials: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  variant: 'a' | 'b' | 'c' | 'user';
}

const SIZE_MAP = {
  sm: { box: 32, fontSize: 11 },
  md: { box: 44, fontSize: 14 },
  lg: { box: 56, fontSize: 18 },
  xl: { box: 72, fontSize: 24 },
} as const;

const GRADIENTS = {
  a: ['#6C63FF', '#A080FF'],
  b: ['#E8517A', '#F07AB0'],
  c: ['#00A99D', '#00D4C8'],
  user: ['#1C2462', '#2D3494'],
} as const;

type LinearGradientProps = {
  colors: [string, string];
  start: { x: number; y: number };
  end: { x: number; y: number };
  style: unknown;
  children: React.ReactNode;
  accessibilityLabel: string;
};

const ExpoLinearGradient = (() => {
  try {
    return require('expo-linear-gradient').LinearGradient as React.ComponentType<LinearGradientProps>;
  } catch {
    return null;
  }
})();

export function Avatar({ initials, size, variant }: AvatarProps) {
  const avatar = SIZE_MAP[size];
  const gradient = GRADIENTS[variant] as [string, string];
  const avatarStyle = [styles.avatar, { width: avatar.box, height: avatar.box, borderRadius: radius.full }];

  if (ExpoLinearGradient) {
    return (
      <ExpoLinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={avatarStyle}
        accessibilityLabel={`Avatar ${initials}`}
      >
        <Text style={[styles.text, { fontSize: avatar.fontSize }]}>{initials}</Text>
      </ExpoLinearGradient>
    );
  }

  return (
    <View style={[avatarStyle, { backgroundColor: gradient[0] }]} accessibilityLabel={`Avatar ${initials}`}>
      <Text style={[styles.text, { fontSize: avatar.fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    fontFamily: fonts.dmSans.bold,
    color: colors.white,
  },
});
