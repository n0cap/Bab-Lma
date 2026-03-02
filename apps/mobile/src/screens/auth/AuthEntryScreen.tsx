import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { ChevronRightIcon } from '../../components';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type AuthMode = 'signin' | 'signup';

function withAlpha(hexColor: string, alpha: number) {
  const hex = hexColor.replace('#', '');
  const bigint = Number.parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AuthEntryScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [tabsWidth, setTabsWidth] = useState(0);
  const indicator = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(indicator, {
      toValue: mode === 'signin' ? 0 : 1,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [indicator, mode]);

  const handleSsoStub = () => {
    Alert.alert('Bientôt disponible');
  };

  const handleTabsLayout = (event: LayoutChangeEvent) => {
    setTabsWidth(event.nativeEvent.layout.width);
  };

  const indicatorWidth = Math.max((tabsWidth - 8) / 2, 0);
  const indicatorTranslate = indicator.interpolate({
    inputRange: [0, 1],
    outputRange: [0, indicatorWidth],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.hero, { paddingTop: insets.top + 26 }]}>
        <View style={styles.blobOne} />
        <View style={styles.blobTwo} />

        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>B</Text>
          </View>
          <Text style={styles.wordmark}>Babloo</Text>
        </View>

        <Text style={styles.tagline}>
          Des artisans de confiance,{"\n"}
          à portée de main.
        </Text>
      </View>

      <ScrollView
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={styles.tabs}
          onLayout={handleTabsLayout}
          accessibilityRole="tablist"
          accessibilityLabel="Mode d'authentification"
        >
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                width: indicatorWidth,
                transform: [
                  {
                    translateX: indicatorTranslate,
                  },
                ],
              },
            ]}
          />

          <Pressable
            style={styles.tabButton}
            onPress={() => setMode('signin')}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'signin' }}
          >
            <Text style={[styles.tabLabel, mode === 'signin' && styles.tabLabelActive]}>Se connecter</Text>
          </Pressable>

          <Pressable
            style={styles.tabButton}
            onPress={() => setMode('signup')}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'signup' }}
          >
            <Text style={[styles.tabLabel, mode === 'signup' && styles.tabLabelActive]}>Créer un compte</Text>
          </Pressable>
        </View>

        <View style={styles.ssoGroup}>
          <Pressable
            style={[styles.ssoButton, styles.ssoGoogle]}
            onPress={handleSsoStub}
            accessibilityRole="button"
            accessibilityLabel="Continuer avec Google"
          >
            <View style={styles.googleGlyphWrap}>
              <Text style={styles.googleGlyph}>G</Text>
            </View>
            <Text style={styles.ssoGoogleText}>Continuer avec Google</Text>
          </Pressable>

          <Pressable
            style={[styles.ssoButton, styles.ssoApple]}
            onPress={handleSsoStub}
            accessibilityRole="button"
            accessibilityLabel="Continuer avec Apple"
          >
            <Text style={styles.appleGlyph}>A</Text>
            <Text style={styles.ssoAppleText}>Continuer avec Apple</Text>
          </Pressable>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.methodGroup}>
          <Pressable
            style={styles.methodButton}
            onPress={() => nav.navigate(mode === 'signin' ? 'SignInEmail' : 'SignUpEmail')}
            accessibilityRole="button"
            accessibilityLabel={mode === 'signin' ? 'Connexion par email' : 'Inscrivez-vous'}
          >
            <View style={styles.methodIconCircle}>
              <Text style={styles.methodIcon}>✉</Text>
            </View>
            <Text style={styles.methodLabel}>Continuer avec l'e-mail</Text>
            <ChevronRightIcon size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={styles.methodButton}
            onPress={() => nav.navigate(mode === 'signin' ? 'SignInPhone' : 'SignUpPhone')}
            accessibilityRole="button"
            accessibilityLabel={mode === 'signin' ? 'Connexion par téléphone' : 'Inscrivez-vous'}
          >
            <View style={styles.methodIconCircle}>
              <Text style={styles.methodIcon}>⌁</Text>
            </View>
            <Text style={styles.methodLabel}>Continuer avec le téléphone</Text>
            <ChevronRightIcon size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        {mode === 'signup' ? (
          <Text style={styles.legalText}>
            En créant un compte, vous acceptez nos{' '}
            <Text style={styles.legalLink}>Conditions d'utilisation</Text> et notre{' '}
            <Text style={styles.legalLink}>Politique de confidentialité</Text>.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  hero: {
    minHeight: '40%',
    paddingHorizontal: 28,
    paddingBottom: 40,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  blobOne: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: withAlpha(colors.clay, 0.22),
  },
  blobTwo: {
    position: 'absolute',
    bottom: -80,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: withAlpha(colors.white, 0.06),
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: withAlpha(colors.white, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.18),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoMarkText: {
    fontFamily: fonts.fraunces.bold,
    fontSize: 24,
    color: colors.white,
  },
  wordmark: {
    fontFamily: fonts.fraunces.bold,
    fontSize: 24,
    color: colors.white,
    letterSpacing: -0.3,
  },
  tagline: {
    fontFamily: fonts.dmSans.regular,
    fontSize: 15,
    lineHeight: 23,
    color: withAlpha(colors.white, 0.62),
  },
  card: {
    flex: 1,
    backgroundColor: colors.bg,
    marginTop: -20,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.md,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.bgAlt,
    borderRadius: radius.full,
    padding: 4,
    position: 'relative',
    marginBottom: spacing.lg,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: radius.full,
    backgroundColor: colors.navy,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabLabel: {
    fontFamily: fonts.dmSans.semiBold,
    fontSize: 14,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.white,
  },
  ssoGroup: {
    marginBottom: 18,
  },
  ssoButton: {
    height: 48,
    borderRadius: radius.full,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ssoGoogle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  ssoApple: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  googleGlyphWrap: {
    width: 20,
    alignItems: 'center',
  },
  googleGlyph: {
    fontFamily: fonts.dmSans.bold,
    fontSize: 16,
    color: colors.navy,
  },
  appleGlyph: {
    width: 20,
    fontSize: 15,
    color: colors.white,
    textAlign: 'center',
    marginTop: -1,
  },
  ssoGoogleText: {
    fontFamily: fonts.dmSans.semiBold,
    fontSize: 14,
    color: colors.navy,
  },
  ssoAppleText: {
    fontFamily: fonts.dmSans.semiBold,
    fontSize: 14,
    color: colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    marginHorizontal: 12,
    ...textStyles.label,
    color: colors.textMuted,
  },
  methodGroup: {
    marginBottom: spacing.md,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  methodIconCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodIcon: {
    fontSize: 14,
    color: colors.textSec,
  },
  methodLabel: {
    flex: 1,
    fontFamily: fonts.dmSans.medium,
    fontSize: 14,
    color: colors.navy,
  },
  legalText: {
    fontFamily: fonts.dmSans.regular,
    fontSize: 12,
    lineHeight: 20,
    color: colors.textSec,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  legalLink: {
    color: colors.navy,
    textDecorationLine: 'underline',
  },
});
