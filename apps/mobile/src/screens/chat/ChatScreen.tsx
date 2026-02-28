import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { OrdersStackParamList } from '../../navigation/OrdersStack';
import { useMessages, useOffers, usePoll } from '../../services/queries/negotiation';
import { useSendMessage, useCreateOffer, useAcceptOffer } from '../../services/mutations/negotiation';
import { useQueryClient } from '@tanstack/react-query';
import { useOrder } from '../../services/queries/orders';
import { useSocket } from '../../contexts/SocketContext';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { useAuth } from '../../contexts/AuthContext';
import { NegotiationBar } from '../../components/NegotiationBar';
import { colors, textStyles, spacing } from '../../theme';

type Route = RouteProp<OrdersStackParamList, 'Chat'>;

interface MessageItem {
  id: string;
  seq: number;
  senderId: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

export function ChatScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const { user } = useAuth();
  const { joinOrder, leaveOrder } = useSocket();
  const { typingUserId, isConnected } = useSocketEvents(orderId);
  const { data: order } = useOrder(orderId);
  const { data: messagesData, isLoading: messagesLoading, fetchNextPage, hasNextPage } = useMessages(orderId);
  const { data: offers } = useOffers(orderId);
  const sendMessage = useSendMessage(orderId);
  const createOffer = useCreateOffer(orderId);
  const acceptOffer = useAcceptOffer(orderId);

  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Join socket room
  useEffect(() => {
    joinOrder(orderId);
    return () => leaveOrder(orderId);
  }, [orderId, joinOrder, leaveOrder]);

  // All messages from all pages, flattened
  const messages = useMemo(() => {
    if (!messagesData?.pages) return [];
    return messagesData.pages.flatMap((page) => page.data ?? []);
  }, [messagesData]);

  // Track max seq for polling cursor
  const maxSeq = useMemo(() => {
    let seq = 0;
    for (const m of messages) {
      if (m.seq > seq) seq = m.seq;
    }
    return seq;
  }, [messages]);

  // Polling fallback — only when socket is disconnected
  const { data: pollData } = usePoll(orderId, maxSeq, !isConnected);

  // When poll returns new data, invalidate caches so queries refetch
  useEffect(() => {
    if (!pollData) return;
    const hasNew =
      (pollData.messages?.length > 0) ||
      (pollData.offers?.length > 0) ||
      (pollData.statusEvents?.length > 0);
    if (hasNew) {
      queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
      queryClient.invalidateQueries({ queryKey: ['offers', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  }, [pollData, orderId, queryClient]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    // Prefer socket if connected, fall back to REST
    if (socket?.connected) {
      socket.emit('message:send', { orderId, content: text });
    } else {
      sendMessage.mutate(text);
    }
  };

  const handleTyping = () => {
    if (socket?.connected) {
      socket.emit('typing:start', { orderId });
    }
  };

  // Find pending offer from the other party
  const pendingOfferFromOther = useMemo(() => {
    if (!offers || !user) return null;
    return offers.find(
      (o: any) => o.status === 'pending' && o.offeredBy !== user.id,
    ) ?? null;
  }, [offers, user]);

  const isNegotiating = order?.status === 'negotiating';

  const renderMessage = ({ item }: { item: MessageItem }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
          {item.content}
        </Text>
        <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther]}>
          {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (messagesLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => nav.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Text style={[textStyles.body, { color: colors.navy }]}>← Retour</Text>
          </TouchableOpacity>
          <Text
            style={[textStyles.h2, { color: colors.navy }]}
            accessibilityRole="header"
          >
            Chat
          </Text>
          <View style={[styles.connectionDot, { backgroundColor: isConnected ? colors.success : colors.error }]} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            typingUserId ? (
              <Text style={styles.typing}>En train d'écrire...</Text>
            ) : null
          }
        />

        {/* Negotiation bar (only during negotiating status) */}
        {isNegotiating && order && (
          <NegotiationBar
            floorPrice={order.floorPrice}
            onSendOffer={(amount) => {
              if (socket?.connected) {
                socket.emit('offer:create', { orderId, amount });
              } else {
                createOffer.mutate(amount);
              }
            }}
            onAcceptOffer={() => {
              if (pendingOfferFromOther) {
                if (socket?.connected) {
                  socket.emit('offer:accept', { orderId, offerId: pendingOfferFromOther.id });
                } else {
                  acceptOffer.mutate(pendingOfferFromOther.id);
                }
              }
            }}
            pendingOfferFromOther={pendingOfferFromOther}
            isSending={createOffer.isPending || acceptOffer.isPending}
          />
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={(text) => {
              setInput(text);
              handleTyping();
            }}
            multiline
            maxLength={2000}
            accessibilityLabel="Message"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
            accessibilityRole="button"
            accessibilityLabel="Envoyer le message"
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messagesList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: colors.navy,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
  },
  bubbleText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMe: { color: colors.white },
  bubbleTextOther: { color: colors.textPrimary },
  bubbleTime: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    marginTop: 2,
  },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.6)' },
  bubbleTimeOther: { color: colors.textMuted },
  typing: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: colors.navy,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
