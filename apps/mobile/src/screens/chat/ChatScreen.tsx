import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { OrdersStackParamList } from '../../navigation/OrdersStack';
import { useMessages, useOffers, usePoll } from '../../services/queries/negotiation';
import { useSendMessage, useCreateOffer, useAcceptOffer } from '../../services/mutations/negotiation';
import { useOrder } from '../../services/queries/orders';
import { useSocket } from '../../contexts/SocketContext';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, BackHeader, Chip, NegotiationBar } from '../../components';
import { CameraIcon, MicIcon, SendIcon } from '../../components';
import { colors, radius, spacing } from '../../theme';

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
  const nav = useNavigation<any>();
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

  useEffect(() => {
    joinOrder(orderId);
    return () => leaveOrder(orderId);
  }, [orderId, joinOrder, leaveOrder]);

  const messages = useMemo(() => {
    if (!messagesData?.pages) return [];
    return messagesData.pages.flatMap((page) => page.data ?? []);
  }, [messagesData]);

  const maxSeq = useMemo(() => {
    let seq = 0;
    for (const m of messages) {
      if (m.seq > seq) seq = m.seq;
    }
    return seq;
  }, [messages]);

  const { data: pollData } = usePoll(orderId, maxSeq, !isConnected);

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

  const pendingOfferFromOther = useMemo(() => {
    if (!offers || !user) return null;
    return offers.find(
      (o: any) => o.status === 'pending' && o.offeredBy !== user.id,
    ) ?? null;
  }, [offers, user]);

  const isNegotiating = order?.status === 'negotiating';

  if (messagesLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <BackHeader
        title=""
        onBack={() => nav.goBack()}
        right={<Chip label="Négociation" variant="success" />}
      />

      <View style={styles.headerMetaWrap}>
        <Avatar initials="Pro" size="md" variant="a" />
        <View style={styles.headerMetaText}>
          <Text style={styles.headerName}>Professionnelle</Text>
          <Text style={styles.headerRole}>Négociation en cours</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: MessageItem }) => {
          const isMe = item.senderId === user?.id;
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>{item.content}</Text>
              <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther]}>
                {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={styles.messagesList}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={typingUserId ? <Text style={styles.typing}>En train d'écrire...</Text> : null}
      />

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

      <View style={styles.inputRow}>
        <CameraIcon size={20} color={colors.textMuted} />
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
        <Pressable
          style={[styles.micWrap, !input.trim() && styles.micWrapIdle]}
          onPress={handleSend}
          disabled={!input.trim()}
          accessibilityRole="button"
          accessibilityLabel="Envoyer le message"
        >
          {input.trim() ? (
            <SendIcon size={20} color={colors.navy} />
          ) : (
            <MicIcon size={20} color={colors.textMuted} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMetaWrap: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerMetaText: {
    flex: 1,
  },
  headerName: {
    color: colors.navy,
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  headerRole: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    marginTop: 1,
  },
  messagesList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    gap: 12,
  },
  bubble: {
    maxWidth: '76%',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: colors.navy,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'DMSans_500Medium',
  },
  bubbleTextMe: { color: colors.white },
  bubbleTextOther: { color: colors.textPrimary },
  bubbleTime: {
    marginTop: 2,
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
  },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.6)' },
  bubbleTimeOther: { color: colors.textMuted },
  typing: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: 'DMSans_400Regular',
    paddingVertical: spacing.xs,
  },
  inputRow: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.navy,
    fontFamily: 'DMSans_400Regular',
    backgroundColor: colors.surface,
    maxHeight: 100,
  },
  micWrap: {
    width: 30,
    alignItems: 'center',
  },
  micWrapIdle: {
    opacity: 0.6,
  },
});
