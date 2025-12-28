import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/device-id';

const { width, height } = Dimensions.get('window');

type LivePresence = {
  deviceId: string;
  name: string;
  emoji?: string;
  avatar?: string;
  role: 'host' | 'participant' | 'viewer';
  slot?: number;
  updatedAt: number;
};

type LiveChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  ts: number;
  type?: 'message' | 'gift' | 'join';
  giftType?: string;
};

type FloatingHeart = {
  id: string;
  anim: Animated.Value;
  x: number;
};

const MAX_PARTICIPANTS = 3;
const CHANNEL_NAME = 'live-room-main';

// Système de Brumes (monnaie virtuelle)
// Achat: 200 brumes = 20€ (0.10€ par brume)
// Créateur reçoit: 200 brumes = 10€ (50% de commission)
const BRUMES_PACKAGES = [
  { id: 'pack1', brumes: 100, price: 9.99, bonus: 0 },
  { id: 'pack2', brumes: 200, price: 19.99, bonus: 10 },
  { id: 'pack3', brumes: 500, price: 44.99, bonus: 50 },
  { id: 'pack4', brumes: 1000, price: 79.99, bonus: 150 },
  { id: 'pack5', brumes: 2500, price: 179.99, bonus: 500 },
];

const GIFTS = [
  { id: 'heart', emoji: '❤️', name: 'Cœur', cost: 5 },
  { id: 'rose', emoji: '🌹', name: 'Rose', cost: 20 },
  { id: 'kiss', emoji: '💋', name: 'Bisou', cost: 50 },
  { id: 'diamond', emoji: '💎', name: 'Diamant', cost: 100 },
  { id: 'crown', emoji: '👑', name: 'Couronne', cost: 300 },
  { id: 'rocket', emoji: '🚀', name: 'Fusée', cost: 500 },
  { id: 'unicorn', emoji: '🦄', name: 'Licorne', cost: 1000 },
  { id: 'yacht', emoji: '🛥️', name: 'Yacht', cost: 5000 },
];

export default function LiveRoomScreen() {
  // Camera
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');

  // User identity
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('Moi');
  const [profileEmoji, setProfileEmoji] = useState<string>('✨');

  // Brumes (virtual currency)
  const [myBrumes, setMyBrumes] = useState(100); // Start with 100 free brumes
  const [hostEarnings, setHostEarnings] = useState(0); // Brumes earned as host
  const [showBrumesShop, setShowBrumesShop] = useState(false);

  // Room state
  const [isHost, setIsHost] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [participants, setParticipants] = useState<LivePresence[]>([]);
  const [viewers, setViewers] = useState<LivePresence[]>([]);
  const [joinRequests, setJoinRequests] = useState<string[]>([]);
  const [myRole, setMyRole] = useState<'host' | 'participant' | 'viewer'>('viewer');

  // Chat & interactions
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([
    // Welcome message
    {
      id: 'welcome-1',
      senderId: 'system',
      senderName: '🎉 Bienvenue',
      text: 'dans le live ! Envoie un message pour discuter',
      ts: Date.now(),
      type: 'join',
    },
  ]);
  const [likesCount, setLikesCount] = useState(0);
  const [showGifts, setShowGifts] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [showViewers, setShowViewers] = useState(false);

  // Animations
  const giftPanelAnim = useRef(new Animated.Value(0)).current;
  const brumesShopAnim = useRef(new Animated.Value(0)).current;
  const chatScrollRef = useRef<ScrollView>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize device ID and profile
  useEffect(() => {
    let active = true;
    (async () => {
      const id = await getDeviceId();
      if (!active) return;
      setDeviceId(id);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, emojis')
          .eq('device_id', id)
          .maybeSingle();

        if (!error && data) {
          setProfileName(data.name || 'Anonyme');
          setProfileEmoji(data.emojis?.[0] || '✨');
        }
      } catch (e) {
        console.log('Profile fetch skipped');
      }
    })();
    return () => { active = false; };
  }, []);

  // Setup realtime channel
  useEffect(() => {
    if (!deviceId) return;

    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: deviceId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<LivePresence>();
        const all = Object.values(state).flat();
        
        const hosts = all.filter(p => p.role === 'host');
        const parts = all.filter(p => p.role === 'participant').slice(0, MAX_PARTICIPANTS);
        const views = all.filter(p => p.role === 'viewer');
        
        setParticipants([...hosts, ...parts]);
        setViewers(views);
        setIsLive(hosts.length > 0);
        
        const me = all.find(p => p.deviceId === deviceId);
        if (me) setMyRole(me.role);
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        const msg = payload as LiveChatMessage;
        // Don't duplicate own messages (already added locally)
        if (msg.senderId === deviceId) return;
        setChatMessages(prev => [...prev.slice(-50), msg]);
        setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .on('broadcast', { event: 'like' }, ({ payload }) => {
        // Don't duplicate own likes (already added locally)
        if (payload?.senderId === deviceId) return;
        setLikesCount(c => c + 1);
        spawnFloatingHeart();
      })
      .on('broadcast', { event: 'gift' }, ({ payload }) => {
        // Don't duplicate own gifts (already added locally)
        if (payload.senderId === deviceId) return;
        
        const gift = GIFTS.find(g => g.id === payload.giftId);
        if (gift) {
          // Add gift message to chat
          setChatMessages(prev => [...prev.slice(-50), {
            id: `gift-${Date.now()}`,
            senderId: payload.senderId,
            senderName: payload.senderName,
            text: `a envoyé ${gift.emoji} ${gift.name} (${gift.cost} ☁️)`,
            ts: Date.now(),
            type: 'gift',
            giftType: gift.id,
          }]);
          
          // If I'm the host, I earn brumes (creator gets the brumes)
          if (isHost) {
            setHostEarnings(prev => prev + gift.cost);
          }
        }
      })
      .on('broadcast', { event: 'request_join' }, ({ payload }) => {
        if (isHost) {
          setJoinRequests(prev => [...new Set([...prev, payload.deviceId])]);
        }
      })
      .on('broadcast', { event: 'accept_join' }, ({ payload }) => {
        if (payload.deviceId === deviceId) {
          updateMyPresence('participant', payload.slot);
        }
      })
      .on('broadcast', { event: 'kick' }, ({ payload }) => {
        if (payload.deviceId === deviceId) {
          updateMyPresence('viewer');
        }
      })
      .on('broadcast', { event: 'end_live' }, () => {
        setIsLive(false);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            deviceId,
            name: profileName,
            emoji: profileEmoji,
            role: 'viewer',
            updatedAt: Date.now(),
          });
          // Announce join
          channel.send({
            type: 'broadcast',
            event: 'chat',
            payload: {
              id: `join-${Date.now()}`,
              senderId: deviceId,
              senderName: profileName,
              text: 'a rejoint le live',
              ts: Date.now(),
              type: 'join',
            },
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [deviceId, profileName, profileEmoji, isHost]);

  const updateMyPresence = async (role: 'host' | 'participant' | 'viewer', slot?: number) => {
    if (!channelRef.current || !deviceId) return;
    setMyRole(role);
    if (role === 'host') setIsHost(true);
    await channelRef.current.track({
      deviceId,
      name: profileName,
      emoji: profileEmoji,
      role,
      slot,
      updatedAt: Date.now(),
    });
  };

  const spawnFloatingHeart = () => {
    const id = `heart-${Date.now()}-${Math.random()}`;
    const anim = new Animated.Value(0);
    const x = Math.random() * 60 + 20;
    
    setFloatingHearts(prev => [...prev, { id, anim, x }]);
    
    Animated.timing(anim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    });
  };

  const toggleCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    setCameraOn(prev => !prev);
  };

  const startLive = async () => {
    await updateMyPresence('host', 0);
    setIsHost(true);
    setIsLive(true);
    setCameraOn(true);
  };

  const endLive = () => {
    channelRef.current?.send({ type: 'broadcast', event: 'end_live', payload: {} });
    setIsLive(false);
    setIsHost(false);
    updateMyPresence('viewer');
  };

  const requestToJoin = () => {
    if (!channelRef.current || !deviceId) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'request_join',
      payload: { deviceId, name: profileName },
    });
  };

  const acceptParticipant = (requesterId: string) => {
    if (!channelRef.current || !isHost) return;
    
    const currentSlots = participants.filter(p => p.role === 'participant').length;
    if (currentSlots >= MAX_PARTICIPANTS) return;
    
    const newSlot = currentSlots + 1;
    channelRef.current.send({
      type: 'broadcast',
      event: 'accept_join',
      payload: { deviceId: requesterId, slot: newSlot },
    });
    setJoinRequests(prev => prev.filter(r => r !== requesterId));
  };

  const kickParticipant = (targetId: string) => {
    if (!channelRef.current || !isHost) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'kick',
      payload: { deviceId: targetId },
    });
  };

  const sendChat = () => {
    if (!channelRef.current || !chatInput.trim()) return;
    const message: LiveChatMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      senderId: deviceId || '',
      senderName: profileName,
      text: chatInput.trim().slice(0, 200),
      ts: Date.now(),
      type: 'message',
    };
    // Add message locally immediately for instant feedback
    setChatMessages(prev => [...prev.slice(-50), message]);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    // Broadcast to others
    channelRef.current.send({ type: 'broadcast', event: 'chat', payload: message });
    setChatInput('');
  };

  const sendLike = () => {
    if (!channelRef.current) return;
    // Add locally immediately
    setLikesCount(c => c + 1);
    spawnFloatingHeart();
    // Broadcast to others
    channelRef.current.send({ type: 'broadcast', event: 'like', payload: { senderId: deviceId } });
  };

  const sendGift = (giftId: string) => {
    if (!channelRef.current) return;
    
    const gift = GIFTS.find(g => g.id === giftId);
    if (!gift) return;
    
    // Check if user has enough brumes
    if (myBrumes < gift.cost) {
      setShowGifts(false);
      setShowBrumesShop(true);
      toggleBrumesShop();
      return;
    }
    
    // Deduct brumes from sender
    setMyBrumes(prev => prev - gift.cost);
    
    // Add gift message locally
    const giftMessage: LiveChatMessage = {
      id: `gift-${Date.now()}`,
      senderId: deviceId || '',
      senderName: profileName,
      text: `a envoyé ${gift.emoji} ${gift.name} (${gift.cost} ☁️)`,
      ts: Date.now(),
      type: 'gift',
      giftType: gift.id,
    };
    setChatMessages(prev => [...prev.slice(-50), giftMessage]);
    
    // Broadcast to others (host will receive earnings)
    channelRef.current.send({
      type: 'broadcast',
      event: 'gift',
      payload: { giftId, cost: gift.cost, senderId: deviceId, senderName: profileName },
    });
    setShowGifts(false);
  };

  const toggleGiftPanel = () => {
    const toValue = showGifts ? 0 : 1;
    setShowGifts(!showGifts);
    Animated.spring(giftPanelAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const toggleBrumesShop = () => {
    const toValue = showBrumesShop ? 0 : 1;
    setShowBrumesShop(!showBrumesShop);
    Animated.spring(brumesShopAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const buyBrumes = (packageId: string) => {
    const pack = BRUMES_PACKAGES.find(p => p.id === packageId);
    if (!pack) return;
    
    // TODO: Integrate real payment (Stripe, Apple Pay, etc.)
    // For now, simulate purchase
    const totalBrumes = pack.brumes + pack.bonus;
    setMyBrumes(prev => prev + totalBrumes);
    setShowBrumesShop(false);
    
    // Show confirmation in chat
    setChatMessages(prev => [...prev.slice(-50), {
      id: `purchase-${Date.now()}`,
      senderId: 'system',
      senderName: '✨ Achat',
      text: `+${totalBrumes} brumes ajoutées à ton compte !`,
      ts: Date.now(),
      type: 'join',
    }]);
  };

  const goBack = () => {
    router.back();
  };

  // Get host for main display
  const host = participants.find(p => p.role === 'host');
  const guestParticipants = participants.filter(p => p.role === 'participant');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Full screen host video/camera */}
      <View style={styles.hostFullScreen}>
        {host ? (
          host.deviceId === deviceId && cameraOn && cameraPermission?.granted ? (
            <CameraView style={StyleSheet.absoluteFill} facing={cameraFacing} />
          ) : (
            <LinearGradient
              colors={['#667eea', '#764ba2', '#f093fb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            >
              <View style={styles.hostPlaceholder}>
                <Text style={styles.hostEmoji}>{host.emoji || '👤'}</Text>
                <Text style={styles.hostName}>{host.name}</Text>
              </View>
            </LinearGradient>
          )
        ) : (
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.noHostContainer}>
              <Text style={styles.noHostIcon}>📺</Text>
              <Text style={styles.noHostTitle}>Aucun live en cours</Text>
              <Text style={styles.noHostSub}>Sois le premier à lancer !</Text>
            </View>
          </LinearGradient>
        )}
        
        {/* Gradient overlay for readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
          locations={[0, 0.2, 0.6, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {/* Top header - Lovoo style */}
      <SafeAreaView style={styles.topHeader} edges={['top']}>
        <TouchableOpacity onPress={goBack} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        <View style={styles.headerRight}>
          {/* Brumes balance */}
          <TouchableOpacity 
            style={styles.brumesBadge}
            onPress={toggleBrumesShop}
          >
            <Text style={styles.brumesIcon}>☁️</Text>
            <Text style={styles.brumesCount}>{myBrumes}</Text>
            <Text style={styles.brumesPlus}>+</Text>
          </TouchableOpacity>

          {/* Viewers count */}
          <TouchableOpacity 
            style={styles.viewersBadge}
            onPress={() => setShowViewers(!showViewers)}
          >
            <Text style={styles.viewersIcon}>👁</Text>
            <Text style={styles.viewersCount}>{viewers.length + participants.length}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Host earnings display (only for host) */}
      {isHost && hostEarnings > 0 && (
        <View style={styles.earningsBadge}>
          <Text style={styles.earningsIcon}>💰</Text>
          <Text style={styles.earningsText}>{hostEarnings} ☁️</Text>
          <Text style={styles.earningsValue}>≈ {(hostEarnings * 0.05).toFixed(2)}€</Text>
        </View>
      )}

      {/* Host info overlay */}
      {host && (
        <View style={styles.hostInfoOverlay}>
          <View style={styles.hostInfoLeft}>
            <View style={styles.hostAvatarContainer}>
              <Text style={styles.hostAvatarEmoji}>{host.emoji || '👤'}</Text>
            </View>
            <View>
              <Text style={styles.hostInfoName}>{host.name}</Text>
              <View style={styles.hostLevelBadge}>
                <Text style={styles.hostLevelText}>Niveau 5</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followBtnText}>Suivre</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating participants bubbles - Lovoo style */}
      <View style={styles.participantsBubbles}>
        {guestParticipants.map((p) => (
          <View key={p.deviceId} style={styles.participantBubble}>
            {p.deviceId === deviceId && cameraOn && cameraPermission?.granted ? (
              <CameraView style={styles.bubbleCamera} facing={cameraFacing} />
            ) : (
              <LinearGradient
                colors={['#a29bfe', '#6c5ce7']}
                style={styles.bubblePlaceholder}
              >
                <Text style={styles.bubbleEmoji}>{p.emoji || '👤'}</Text>
              </LinearGradient>
            )}
            <View style={styles.bubbleNameTag}>
              <Text style={styles.bubbleName} numberOfLines={1}>{p.name}</Text>
            </View>
            {isHost && (
              <TouchableOpacity 
                style={styles.bubbleKick}
                onPress={() => kickParticipant(p.deviceId)}
              >
                <Text style={styles.bubbleKickText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        {/* Empty slots */}
        {Array.from({ length: MAX_PARTICIPANTS - guestParticipants.length }).map((_, idx) => (
          <TouchableOpacity 
            key={`empty-${idx}`}
            style={[styles.participantBubble, styles.emptyBubble]}
            onPress={myRole === 'viewer' && isLive ? requestToJoin : undefined}
          >
            <Text style={styles.emptyBubbleIcon}>+</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Floating hearts animation */}
      <View style={styles.heartsContainer} pointerEvents="none">
        {floatingHearts.map(heart => (
          <Animated.Text
            key={heart.id}
            style={[
              styles.floatingHeart,
              {
                right: heart.x,
                transform: [
                  {
                    translateY: heart.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -300],
                    }),
                  },
                  {
                    scale: heart.anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 1.2, 0.8],
                    }),
                  },
                ],
                opacity: heart.anim.interpolate({
                  inputRange: [0, 0.8, 1],
                  outputRange: [1, 1, 0],
                }),
              },
            ]}
          >
            ❤️
          </Animated.Text>
        ))}
      </View>

      {/* Chat messages overlay - Lovoo style */}
      <View style={styles.chatOverlay}>
        <ScrollView 
          ref={chatScrollRef}
          style={styles.chatScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatContent}
        >
          {chatMessages.slice(-30).map(msg => (
            <View 
              key={msg.id} 
              style={[
                styles.chatMessage,
                msg.type === 'gift' && styles.chatGiftMessage,
                msg.type === 'join' && styles.chatJoinMessage,
              ]}
            >
              <Text style={styles.chatSenderName}>{msg.senderName}</Text>
              <Text style={[
                styles.chatMessageText,
                msg.type === 'gift' && styles.chatGiftText,
                msg.type === 'join' && styles.chatJoinText,
              ]}>
                {msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Join requests panel (host only) */}
      {isHost && joinRequests.length > 0 && (
        <View style={styles.requestsPanel}>
          <BlurView intensity={80} tint="dark" style={styles.requestsBlur}>
            <Text style={styles.requestsTitle}>
              {joinRequests.length} demande{joinRequests.length > 1 ? 's' : ''}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {joinRequests.map(req => (
                <TouchableOpacity 
                  key={req} 
                  style={styles.requestItem}
                  onPress={() => acceptParticipant(req)}
                >
                  <View style={styles.requestAvatar}>
                    <Text style={styles.requestAvatarText}>👤</Text>
                  </View>
                  <Text style={styles.requestName}>{req.slice(0, 6)}...</Text>
                  <View style={styles.requestAcceptBtn}>
                    <Text style={styles.requestAcceptText}>✓</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </BlurView>
        </View>
      )}

      {/* Gift panel */}
      <Animated.View 
        style={[
          styles.giftPanel,
          {
            transform: [{
              translateY: giftPanelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0],
              }),
            }],
            opacity: giftPanelAnim,
          },
        ]}
        pointerEvents={showGifts ? 'auto' : 'none'}
      >
        <BlurView intensity={90} tint="dark" style={styles.giftPanelBlur}>
          <View style={styles.giftPanelHeader}>
            <Text style={styles.giftPanelTitle}>Envoyer un cadeau</Text>
            <TouchableOpacity onPress={toggleBrumesShop} style={styles.giftPanelBalance}>
              <Text style={styles.giftBalanceText}>☁️ {myBrumes} brumes</Text>
              <Text style={styles.giftBalancePlus}>+</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.giftList}>
            {GIFTS.map(gift => {
              const canAfford = myBrumes >= gift.cost;
              return (
                <TouchableOpacity 
                  key={gift.id}
                  style={[styles.giftItem, !canAfford && styles.giftItemDisabled]}
                  onPress={() => sendGift(gift.id)}
                >
                  <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                  <Text style={styles.giftName}>{gift.name}</Text>
                  <View style={[styles.giftCost, !canAfford && styles.giftCostDisabled]}>
                    <Text style={[styles.giftCostText, !canAfford && styles.giftCostTextDisabled]}>
                      ☁️ {gift.cost}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </BlurView>
      </Animated.View>

      {/* Brumes Shop Modal */}
      {showBrumesShop && (
        <TouchableOpacity 
          style={styles.shopModal}
          activeOpacity={1}
          onPress={() => setShowBrumesShop(false)}
        >
          <BlurView intensity={95} tint="dark" style={styles.shopContent}>
            <View style={styles.shopHeader}>
              <Text style={styles.shopTitle}>☁️ Acheter des Brumes</Text>
              <Text style={styles.shopSubtitle}>Offre des cadeaux aux créateurs !</Text>
            </View>
            
            <View style={styles.shopBalance}>
              <Text style={styles.shopBalanceLabel}>Ton solde</Text>
              <Text style={styles.shopBalanceValue}>☁️ {myBrumes}</Text>
            </View>

            <ScrollView style={styles.shopPackages}>
              {BRUMES_PACKAGES.map(pack => (
                <TouchableOpacity 
                  key={pack.id}
                  style={styles.shopPackage}
                  onPress={() => buyBrumes(pack.id)}
                >
                  <View style={styles.packageLeft}>
                    <Text style={styles.packageBrumes}>☁️ {pack.brumes}</Text>
                    {pack.bonus > 0 && (
                      <View style={styles.packageBonus}>
                        <Text style={styles.packageBonusText}>+{pack.bonus} bonus</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.packageRight}>
                    <Text style={styles.packagePrice}>{pack.price.toFixed(2)}€</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.shopInfo}>
              <Text style={styles.shopInfoText}>
                💡 Offre des cadeaux pour soutenir tes créateurs préférés !
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.shopClose}
              onPress={() => setShowBrumesShop(false)}
            >
              <Text style={styles.shopCloseText}>Fermer</Text>
            </TouchableOpacity>
          </BlurView>
        </TouchableOpacity>
      )}

      {/* Bottom controls - Lovoo style */}
      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <BlurView intensity={60} tint="dark" style={styles.bottomBlur}>
          {/* Chat input */}
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Dire quelque chose..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.textInput}
                onSubmitEditing={sendChat}
                returnKeyType="send"
              />
            </View>
            
            {/* Action buttons */}
            <TouchableOpacity style={styles.iconBtn} onPress={toggleGiftPanel}>
              <Text style={styles.iconBtnText}>🎁</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.iconBtn, styles.heartBtn]} onPress={sendLike}>
              <Text style={styles.iconBtnText}>❤️</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom action row */}
          <View style={styles.bottomActions}>
            {(myRole === 'host' || myRole === 'participant') && (
              <>
                <TouchableOpacity 
                  style={[styles.actionCircle, cameraOn && styles.actionCircleActive]}
                  onPress={toggleCamera}
                >
                  <Text style={styles.actionCircleIcon}>{cameraOn ? '📹' : '📷'}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionCircle}
                  onPress={() => setCameraFacing(f => f === 'front' ? 'back' : 'front')}
                >
                  <Text style={styles.actionCircleIcon}>🔄</Text>
                </TouchableOpacity>
              </>
            )}

            {myRole === 'viewer' && !isLive && (
              <TouchableOpacity style={styles.goLiveBtn} onPress={startLive}>
                <LinearGradient
                  colors={['#e53935', '#d32f2f']}
                  style={styles.goLiveGradient}
                >
                  <Text style={styles.goLiveBtnText}>Go Live</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {myRole === 'viewer' && isLive && (
              <TouchableOpacity style={styles.joinLiveBtn} onPress={requestToJoin}>
                <Text style={styles.joinLiveBtnText}>Demander à rejoindre</Text>
              </TouchableOpacity>
            )}

            {isHost && (
              <TouchableOpacity style={styles.endLiveBtn} onPress={endLive}>
                <Text style={styles.endLiveBtnText}>Terminer le live</Text>
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
      </SafeAreaView>

      {/* Viewers list modal */}
      {showViewers && (
        <TouchableOpacity 
          style={styles.viewersModal}
          activeOpacity={1}
          onPress={() => setShowViewers(false)}
        >
          <BlurView intensity={90} tint="dark" style={styles.viewersContent}>
            <Text style={styles.viewersTitle}>Spectateurs ({viewers.length})</Text>
            <ScrollView style={styles.viewersList}>
              {viewers.map(v => (
                <View key={v.deviceId} style={styles.viewerItem}>
                  <Text style={styles.viewerEmoji}>{v.emoji || '👤'}</Text>
                  <Text style={styles.viewerName}>{v.name}</Text>
                </View>
              ))}
              {viewers.length === 0 && (
                <Text style={styles.noViewers}>Aucun spectateur pour le moment</Text>
              )}
            </ScrollView>
          </BlurView>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Full screen host
  hostFullScreen: {
    ...StyleSheet.absoluteFillObject,
  },
  hostPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostEmoji: {
    fontSize: 120,
    marginBottom: 16,
  },
  hostName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  noHostContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noHostIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  noHostTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  noHostSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },

  // Top header
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e53935',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  viewersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  viewersIcon: {
    fontSize: 14,
  },
  viewersCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Host info overlay
  hostInfoOverlay: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  hostInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hostAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  hostAvatarEmoji: {
    fontSize: 24,
  },
  hostInfoName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hostLevelBadge: {
    backgroundColor: 'rgba(255,215,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  hostLevelText: {
    color: '#ffd700',
    fontSize: 11,
    fontWeight: '700',
  },
  followBtn: {
    backgroundColor: '#e53935',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Participant bubbles
  participantsBubbles: {
    position: 'absolute',
    top: 170,
    right: 12,
    gap: 10,
    zIndex: 5,
  },
  participantBubble: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bubbleCamera: {
    width: '100%',
    height: '100%',
  },
  bubblePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleEmoji: {
    fontSize: 28,
  },
  bubbleNameTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 2,
  },
  bubbleName: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  bubbleKick: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleKickText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBubble: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBubbleIcon: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 28,
    fontWeight: '300',
  },

  // Floating hearts
  heartsContainer: {
    position: 'absolute',
    right: 0,
    bottom: 200,
    width: 100,
    height: 300,
  },
  floatingHeart: {
    position: 'absolute',
    bottom: 0,
    fontSize: 32,
  },

  // Chat overlay
  chatOverlay: {
    position: 'absolute',
    left: 12,
    right: 100,
    bottom: 180,
    maxHeight: 220,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingVertical: 8,
  },
  chatMessage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  chatGiftMessage: {
    backgroundColor: 'rgba(255,215,0,0.3)',
  },
  chatJoinMessage: {
    backgroundColor: 'rgba(108,92,231,0.4)',
  },
  chatSenderName: {
    color: '#ffd700',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  chatMessageText: {
    color: '#fff',
    fontSize: 13,
  },
  chatGiftText: {
    color: '#ffd700',
  },
  chatJoinText: {
    color: '#a29bfe',
    fontStyle: 'italic',
  },

  // Requests panel
  requestsPanel: {
    position: 'absolute',
    top: 160,
    left: 12,
    right: 90,
    zIndex: 10,
  },
  requestsBlur: {
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
  },
  requestsTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  requestItem: {
    alignItems: 'center',
    marginRight: 12,
    gap: 4,
  },
  requestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAvatarText: {
    fontSize: 20,
  },
  requestName: {
    color: '#fff',
    fontSize: 11,
  },
  requestAcceptBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAcceptText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Gift panel
  giftPanel: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
  },
  giftPanelBlur: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  giftPanelTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  giftList: {
    flexDirection: 'row',
  },
  giftItem: {
    alignItems: 'center',
    marginRight: 20,
    gap: 4,
  },
  giftEmoji: {
    fontSize: 40,
  },
  giftName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBlur: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  textInput: {
    height: 44,
    color: '#fff',
    fontSize: 15,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    backgroundColor: 'rgba(229,57,53,0.6)',
  },
  iconBtnText: {
    fontSize: 22,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleActive: {
    backgroundColor: 'rgba(76,175,80,0.6)',
  },
  actionCircleIcon: {
    fontSize: 22,
  },
  goLiveBtn: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  goLiveGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  goLiveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  joinLiveBtn: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  joinLiveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  endLiveBtn: {
    backgroundColor: 'rgba(229,57,53,0.8)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  endLiveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Viewers modal
  viewersModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  viewersContent: {
    width: width * 0.85,
    maxHeight: height * 0.6,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  viewersTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  viewersList: {
    maxHeight: 300,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  viewerEmoji: {
    fontSize: 28,
  },
  viewerName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  noViewers: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },

  // Brumes styles
  brumesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,193,7,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.5)',
  },
  brumesIcon: {
    fontSize: 14,
  },
  brumesCount: {
    color: '#ffc107',
    fontSize: 14,
    fontWeight: '700',
  },
  buyBrumesSmallBtn: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 6,
  },
  buyBrumesSmallText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  giftPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  giftPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brumesBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,193,7,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  brumesBalanceIcon: {
    fontSize: 12,
  },
  brumesBalanceText: {
    color: '#ffc107',
    fontSize: 13,
    fontWeight: '700',
  },
  buyBrumesBtn: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  buyBrumesBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  brumesPacksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  brumesPack: {
    flex: 1,
    backgroundColor: 'rgba(255,193,7,0.15)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.3)',
  },
  brumesPackAmount: {
    color: '#ffc107',
    fontSize: 16,
    fontWeight: '800',
  },
  brumesPackPrice: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  brumesPackBonus: {
    color: '#4caf50',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  giftCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  giftCostIcon: {
    fontSize: 10,
  },
  giftCostText: {
    color: '#ffc107',
    fontSize: 11,
    fontWeight: '600',
  },
  hostEarningsContainer: {
    position: 'absolute',
    top: 150,
    right: 16,
    backgroundColor: 'rgba(76,175,80,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.5)',
    alignItems: 'center',
  },
  hostEarningsLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  hostEarningsAmount: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brumesPlus: {
    color: '#ffc107',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 2,
  },
  earningsBadge: {
    position: 'absolute',
    top: 110,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(76,175,80,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.5)',
    zIndex: 10,
  },
  earningsIcon: {
    fontSize: 14,
  },
  earningsText: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '700',
  },
  earningsValue: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  // Gift panel balance
  giftPanelBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,193,7,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  giftBalanceText: {
    color: '#ffc107',
    fontSize: 14,
    fontWeight: '700',
  },
  giftBalancePlus: {
    color: '#ffc107',
    fontSize: 16,
    fontWeight: '800',
  },
  giftItemDisabled: {
    opacity: 0.5,
  },
  giftCostDisabled: {
    opacity: 0.5,
  },
  giftCostTextDisabled: {
    color: 'rgba(255,193,7,0.5)',
  },
  // Brumes Shop Modal
  shopModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  shopContent: {
    width: width * 0.9,
    maxHeight: height * 0.7,
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
  },
  shopHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  shopTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  shopSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  shopBalance: {
    backgroundColor: 'rgba(255,193,7,0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.3)',
  },
  shopBalanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  shopBalanceValue: {
    color: '#ffc107',
    fontSize: 28,
    fontWeight: '800',
  },
  shopPackages: {
    maxHeight: 280,
  },
  shopPackage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  packageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packageBrumes: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  packageBonus: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  packageBonusText: {
    color: '#4caf50',
    fontSize: 11,
    fontWeight: '700',
  },
  packageRight: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    color: '#ffc107',
    fontSize: 18,
    fontWeight: '800',
  },
  shopInfo: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  shopInfoText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  shopInfoSubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  shopClose: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 20,
    alignItems: 'center',
  },
  shopCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
