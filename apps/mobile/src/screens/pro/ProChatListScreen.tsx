import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar, Card, Chip } from '../../components';
import type { ProChatStackParamList } from '../../navigation/ProMainTabs';
import { useProOrders } from '../../services/queries/pro';
import { colors, spacing, textStyles } from '../../theme';

type Nav = NativeStackNavigationProp<ProChatStackParamList, 'ProChatList'>;

const ACTIVE_CHAT_STATUSES = ['negotiating', 'accepted', 'en_route', 'in_progress'];

const SERVICE_LABELS: Record<string, string> = {
  menage: 'Ménage',
  cuisine: 'Cuisine',
  childcare: 'Garde d\'enfants',
};

function getInitials(fullName?: string | null) {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getPreview(order: {
  statusEvents?: Array<{ reason?: string | null }>;
  status: string;
}) {
  const reason = [...(order.statusEvents ?? [])].reverse().find((event) => event.reason)?.reason;
  if (reason) return reason;
  if (order.status === 'negotiating') return 'Négociation active, ouvrez le chat pour répondre.';
  return 'Conversation active.';
}

export function ProChatListScreen() {
  const nav = useNavigation<Nav>();
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProOrders();

  const chatOrders = useMemo(
    () => (data?.pages.flatMap((page) => page.data) ?? []).filter((order) => ACTIVE_CHAT_STATUSES.includes(order.status)),
    [data],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Conversations</Text>
        <Text style={styles.subtitle}>Vos chats actifs avec les clients</Text>
      </View>

      <FlatList
        data={chatOrders}
        keyExtractor={(item) => item.assignmentId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.navy} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.navy} /> : null}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucune conversation active.</Text>}
        renderItem={({ item }) => {
          const name = item.client?.fullName ?? 'Client';
          const initials = getInitials(name);
          const serviceLabel = SERVICE_LABELS[item.serviceType] ?? item.serviceType;
          const preview = getPreview(item);
          const stamp = new Date(item.createdAt).toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <Pressable
              onPress={() => nav.navigate('Chat', { orderId: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`Ouvrir le chat avec ${name}`}
            >
              <Card style={styles.chatCard}>
                <View style={styles.row}>
                  <Avatar initials={initials} size="md" variant="a" />
                  <View style={styles.meta}>
                    <View style={styles.topRow}>
                      <Text style={styles.name}>{name}</Text>
                      <Text style={styles.timestamp}>{stamp}</Text>
                    </View>
                    <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
                    <Chip label={serviceLabel} variant="navy" style={styles.chip} />
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...textStyles.h1,
    color: colors.navy,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  chatCard: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meta: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    color: colors.navy,
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    flex: 1,
  },
  timestamp: {
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },
  preview: {
    color: colors.textSec,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  chip: {
    marginTop: spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    marginTop: spacing['2xl'],
  },
});
