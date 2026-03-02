import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card, Chip } from './index';
import { colors, radius, shadows, spacing, textStyles } from '../theme';

export type ProProfile = {
  name: string;
  initials: string;
  variant: 'a' | 'b' | 'c' | 'user';
  role: string;
  experience: string;
  rating: number;
  count: number;
  skills: string[];
  reliability: number;
};

interface ProSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  pro: ProProfile | null;
  onSelect: () => void;
}

const REVIEW_QUOTES = [
  'Ponctuelle et très organisée, excellent service.',
  'Travail soigné du début à la fin.',
  'Communication claire, je recommande vivement.',
];

export function ProSelectionModal({ visible, onClose, pro, onSelect }: ProSelectionModalProps) {
  if (!pro) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <Avatar initials={pro.initials} size="xl" variant={pro.variant} />
              <Text style={styles.name}>{pro.name}</Text>
              <Text style={styles.role}>
                {pro.role} · {pro.experience} d&apos;exp.
              </Text>
            </View>

            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{pro.rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Note</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{pro.count}</Text>
                <Text style={styles.statLabel}>Prestations</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{pro.reliability}%</Text>
                <Text style={styles.statLabel}>Fiabilité</Text>
              </Card>
            </View>

            <Text style={styles.sectionLabel}>Compétences</Text>
            <View style={styles.chipsWrap}>
              {pro.skills.map((skill) => (
                <Chip key={skill} label={skill} variant="navy" />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Avis clients</Text>
            <View style={styles.reviewsWrap}>
              {REVIEW_QUOTES.map((quote) => (
                <Card key={quote} style={styles.reviewCard}>
                  <Text style={styles.reviewQuote}>&ldquo;{quote}&rdquo;</Text>
                </Card>
              ))}
            </View>
          </ScrollView>

          <Button variant="clay" label="Sélectionner cette professionnelle" onPress={onSelect} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(14,20,66,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
    paddingBottom: spacing['2xl'],
    maxHeight: '82%',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: 18,
    backgroundColor: colors.borderStrong,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  name: {
    ...textStyles.h1,
    color: colors.navy,
    marginTop: spacing.sm,
  },
  role: {
    ...textStyles.body,
    color: colors.textSec,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.bgAlt,
    shadowOpacity: 0,
    elevation: 0,
  },
  statValue: {
    ...textStyles.h1,
    color: colors.navy,
    lineHeight: 24,
  },
  statLabel: {
    ...textStyles.label,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  reviewsWrap: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  reviewQuote: {
    ...textStyles.body,
    color: colors.textSec,
    lineHeight: 20,
  },
});
