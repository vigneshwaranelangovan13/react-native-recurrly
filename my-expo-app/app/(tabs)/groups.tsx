// app/(tabs)/groups.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable, Alert,
  ActivityIndicator, ScrollView, StyleSheet, Platform,
  RefreshControl, Modal, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/expo';
import * as Notifications from 'expo-notifications';
import type { RealtimeChannel } from '@supabase/supabase-js';
import dayjs from 'dayjs';

import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/lib/userStore';
import { useCurrencyStore } from '@/lib/currencyStore';
import { colors } from '@/constants/theme';
import PhoneSetupModal from '@/components/PhoneSetupModal';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function fireNotification(title: string, body: string) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('groups', {
      name: 'Group Events',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  await Notifications.scheduleNotificationAsync({
    content: { title, body, ...(Platform.OS === 'android' && { channelId: 'groups' }) },
    trigger: null,
  });
}

function maskEmail(email: string): string {
  const atIdx = email.indexOf('@');
  if (atIdx < 0) return email;
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx);
  return `${local.slice(0, Math.min(2, local.length))}***${domain}`;
}

function timeAgo(dateStr: string): string {
  const now = dayjs();
  const d = dayjs(dateStr);
  const mins = now.diff(d, 'minute');
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = now.diff(d, 'hour');
  if (hours < 24) return `${hours}h ago`;
  return `${now.diff(d, 'day')}d ago`;
}

// ── Create Group Modal ────────────────────────────────────────────────────────
const SUBSCRIPTION_OPTIONS = [
  { emoji: '📺', name: 'Netflix' },
  { emoji: '🎵', name: 'Spotify' },
  { emoji: '🎮', name: 'Xbox Game Pass' },
  { emoji: '🍎', name: 'Apple One' },
  { emoji: '☁️', name: 'iCloud' },
  { emoji: '🎬', name: 'Disney+' },
  { emoji: '🎙️', name: 'YouTube Premium' },
  { emoji: '📚', name: 'Kindle Unlimited' },
  { emoji: '🔒', name: 'NordVPN' },
  { emoji: '🖥️', name: 'Adobe CC' },
  { emoji: '🤖', name: 'ChatGPT Plus' },
  { emoji: '✨', name: 'Other' },
];

const CARD_COLORS = ['#f5c542', '#8fd1bd', '#b8d4e3', '#e8def8', '#ea7a53', '#95e1d3'];

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  appUserId: string;
  region: string;
}

function CreateGroupModal({ visible, onClose, onCreated, appUserId, region }: CreateGroupModalProps) {
  const [selectedSub, setSelectedSub] = useState<typeof SUBSCRIPTION_OPTIONS[0] | null>(null);
  const [customName, setCustomName] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [description, setDescription] = useState('');
  const [cardColor, setCardColor] = useState(CARD_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const subName = selectedSub?.name === 'Other' ? customName.trim() : selectedSub?.name ?? '';
  const isValid =
      !!selectedSub &&
      (selectedSub.name !== 'Other' || customName.trim().length > 0) &&
      description.trim().length > 0;

  const resetForm = () => {
    setSelectedSub(null);
    setCustomName('');
    setMaxMembers(4);
    setDescription('');
    setCardColor(CARD_COLORS[0]);
  };

  const handleCreate = async () => {
    if (!isValid || !selectedSub) return;

    if (!appUserId) {
      Alert.alert('Not ready', 'Your account is still loading. Please try again in a moment.');
      return;
    }

    setIsCreating(true);
    console.log('[CreateGroup] Creating:', subName, 'userId:', appUserId, 'region:', region);

    const { data: code, error: rpcError } = await supabase.rpc('generate_group_code', {
      subscription_name: subName,
    });

    if (rpcError) console.error('[CreateGroup] RPC error:', rpcError);
    console.log('[CreateGroup] Generated code:', code);

    const { error } = await supabase.from('groups').insert({
      unique_code: code ?? `GR-${Date.now()}`,
      owner_id: appUserId,
      subscription_name: subName,
      emoji: selectedSub.emoji,
      max_members: maxMembers,
      current_members: 1,
      region,
      description: description.trim(),
      card_color: cardColor,
      status: 'open',
    });

    setIsCreating(false);

    if (error) {
      console.error('[CreateGroup] Insert error:', error);
      Alert.alert('Error', 'Could not create group. Please try again.');
      return;
    }

    console.log('[CreateGroup] Success');
    resetForm();
    onClose();
    onCreated();
    Alert.alert('Group Created! 🎉', `Your group is now visible to people in ${region}.`);
  };

  return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={cgStyles.overlay} onPress={onClose}>
            <Pressable style={cgStyles.sheet} onPress={(e) => e.stopPropagation()}>
              <View style={cgStyles.handle} />
              <View style={cgStyles.header}>
                <Text style={cgStyles.title}>Create Sharing Group</Text>
                <Pressable style={cgStyles.closeBtn} onPress={onClose}>
                  <Text style={cgStyles.closeText}>✕</Text>
                </Pressable>
              </View>
              <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={cgStyles.scroll}
              >
                <Text style={cgStyles.label}>Which subscription?</Text>
                <View style={cgStyles.subGrid}>
                  {SUBSCRIPTION_OPTIONS.map((s) => {
                    const sel = selectedSub?.name === s.name;
                    return (
                        <Pressable
                            key={s.name}
                            onPress={() => setSelectedSub(s)}
                            style={[cgStyles.subChip, sel && cgStyles.subChipSelected]}
                        >
                          <Text style={cgStyles.subEmoji}>{s.emoji}</Text>
                          <Text style={[cgStyles.subChipText, sel && cgStyles.subChipTextSelected]}>
                            {s.name}
                          </Text>
                        </Pressable>
                    );
                  })}
                </View>

                {selectedSub?.name === 'Other' && (
                    <TextInput
                        style={cgStyles.input}
                        placeholder="Subscription name"
                        placeholderTextColor="rgba(0,0,0,0.4)"
                        value={customName}
                        onChangeText={setCustomName}
                    />
                )}

                <Text style={cgStyles.label}>Max members (including you)</Text>
                <View style={cgStyles.memberRow}>
                  {[2, 3, 4, 5, 6].map((n) => (
                      <Pressable
                          key={n}
                          onPress={() => setMaxMembers(n)}
                          style={[cgStyles.memberChip, maxMembers === n && cgStyles.memberChipSelected]}
                      >
                        <Text style={[cgStyles.memberChipText, maxMembers === n && cgStyles.memberChipTextSelected]}>
                          {n}
                        </Text>
                      </Pressable>
                  ))}
                </View>

                <Text style={cgStyles.label}>Tell others about your group</Text>
                <TextInput
                    style={[cgStyles.input, cgStyles.textarea]}
                    placeholder={`e.g. "I pay for ${subName || 'Netflix'}. Looking for ${maxMembers - 1} people to split."`}
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                />

                <Text style={cgStyles.label}>Card color</Text>
                <View style={cgStyles.colorRow}>
                  {CARD_COLORS.map((c) => (
                      <Pressable
                          key={c}
                          onPress={() => setCardColor(c)}
                          style={[cgStyles.colorDot, { backgroundColor: c }, cardColor === c && cgStyles.colorDotSelected]}
                      />
                  ))}
                </View>

                <View style={cgStyles.regionNote}>
                  <Text style={cgStyles.regionNoteText}>
                    📍 Visible to people in{' '}
                    <Text style={{ fontFamily: 'sans-bold', color: colors.primary }}>{region}</Text>
                  </Text>
                </View>

                <Pressable
                    style={[cgStyles.createBtn, (!isValid || isCreating) && cgStyles.createBtnDisabled]}
                    onPress={handleCreate}
                    disabled={!isValid || isCreating}
                >
                  {isCreating
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={cgStyles.createBtnText}>Create Group</Text>
                  }
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
  );
}

const cgStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 18, fontFamily: 'sans-bold', color: colors.primary },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 14, fontFamily: 'sans-bold', color: colors.primary },
  scroll: { padding: 20, gap: 12, paddingBottom: 40 },
  label: { fontSize: 14, fontFamily: 'sans-semibold', color: colors.primary, marginBottom: 8 },
  subGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  subChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  subChipSelected: { borderColor: colors.accent, backgroundColor: 'rgba(234,122,83,0.12)' },
  subEmoji: { fontSize: 16 },
  subChipText: { fontSize: 13, fontFamily: 'sans-medium', color: colors.mutedForeground },
  subChipTextSelected: { color: colors.accent, fontFamily: 'sans-semibold' },
  memberRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  memberChip: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  memberChipSelected: { borderColor: colors.accent, backgroundColor: 'rgba(234,122,83,0.12)' },
  memberChipText: { fontSize: 16, fontFamily: 'sans-bold', color: colors.mutedForeground },
  memberChipTextSelected: { color: colors.accent },
  input: { backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: 'sans-medium', color: colors.primary, borderWidth: 1, borderColor: colors.border },
  textarea: { height: 90, textAlignVertical: 'top' },
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: colors.primary },
  regionNote: { backgroundColor: colors.muted, borderRadius: 12, padding: 12 },
  regionNoteText: { fontSize: 13, fontFamily: 'sans-medium', color: colors.mutedForeground },
  createBtn: { backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  createBtnDisabled: { opacity: 0.45 },
  createBtnText: { fontSize: 16, fontFamily: 'sans-bold', color: '#fff' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function GroupsScreen() {
  const { user } = useUser();
  const { appUser, syncUser } = useUserStore();
  const { region } = useCurrencyStore();

  const [activeTab, setActiveTab] = useState<'discover' | 'myGroups'>('discover');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [openGroups, setOpenGroups] = useState<SupabaseGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const [ownedGroups, setOwnedGroups] = useState<SupabaseGroup[]>([]);
  const [pendingMembers, setPendingMembers] = useState<Record<string, SupabaseMember[]>>({});
  const [joinedGroups, setJoinedGroups] = useState<SupabaseGroup[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const realtimeRef = useRef<RealtimeChannel | null>(null);

  const fetchOpenGroups = useCallback(async (r: string) => {
    console.log('[fetchOpenGroups] region:', r);
    const { data, error } = await supabase
        .from('groups')
        .select('*, owner:users(*)')
        .eq('status', 'open')
        .eq('region', r)
        .order('created_at', { ascending: false });
    if (error) console.error('[fetchOpenGroups] error:', error);
    else console.log('[fetchOpenGroups] got', data?.length ?? 0, 'groups');
    setOpenGroups(data ?? []);
  }, []);

  const fetchMyGroups = useCallback(async (userId: string) => {
    console.log('[fetchMyGroups] userId:', userId);
    const { data: owned, error: ownedErr } = await supabase
        .from('groups')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
    if (ownedErr) console.error('[fetchMyGroups] owned error:', ownedErr);

    const ownedList = owned ?? [];
    setOwnedGroups(ownedList);

    const map: Record<string, SupabaseMember[]> = {};
    await Promise.all(
        ownedList.map(async (g) => {
          const { data } = await supabase
              .from('group_members')
              .select('*, user:users(*)')
              .eq('group_id', g.id)
              .eq('status', 'pending')
              .order('requested_at', { ascending: true });
          map[g.id] = data ?? [];
        })
    );
    setPendingMembers(map);

    const { data: memberRows, error: memberErr } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)
        .eq('status', 'approved');
    if (memberErr) console.error('[fetchMyGroups] member error:', memberErr);

    if (memberRows && memberRows.length > 0) {
      const groupIds = memberRows.map((r: { group_id: string }) => r.group_id);
      const { data: joinedData } = await supabase
          .from('groups')
          .select('*, owner:users(*)')
          .in('id', groupIds)
          .neq('owner_id', userId);
      setJoinedGroups(joinedData ?? []);
    } else {
      setJoinedGroups([]);
    }
  }, []);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    let mounted = true;

    const init = async () => {
      try {
        console.log('[Groups] init — user:', user.id);
        const primaryEmail = user.primaryEmailAddress?.emailAddress ?? '';
        const displayName =
            [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
            user.username || 'User';
        const userRegion = useCurrencyStore.getState().region || 'United States';

        console.log('[Groups] syncUser — email:', primaryEmail, 'region:', userRegion);
        await syncUser(user.id, displayName, primaryEmail, userRegion);

        const { appUser: synced } = useUserStore.getState();
        console.log('[Groups] appUser after sync:', synced ? synced.id : 'NULL');

        if (!mounted) return;

        if (synced) {
          if (!synced.phone) setShowPhoneModal(true);
          await Promise.all([
            fetchOpenGroups(synced.region),
            fetchMyGroups(synced.id),
          ]);
          console.log('[Groups] fetches complete');
        } else {
          console.warn('[Groups] appUser null — showing empty state');
        }
      } catch (err) {
        console.error('[Groups] init error:', err);
      } finally {
        if (mounted) {
          console.log('[Groups] isLoading = false');
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
    };
  }, [user?.id, syncUser, fetchOpenGroups, fetchMyGroups]);

  const handleRefresh = useCallback(async () => {
    if (!appUser) return;
    setIsRefreshing(true);
    await Promise.all([fetchOpenGroups(appUser.region), fetchMyGroups(appUser.id)]);
    setIsRefreshing(false);
  }, [appUser, fetchOpenGroups, fetchMyGroups]);

  const handleJoinRequest = useCallback((group: SupabaseGroup) => {
    if (!appUser) {
      Alert.alert('Not ready', 'Your account is still loading. Please try again.');
      return;
    }
    const phoneNote = appUser.phone
        ? `Your phone number (${appUser.phone}) will be visible to the group owner.`
        : 'You have no phone number saved. Add one in settings so the owner can contact you.';

    Alert.alert(
        'Send Join Request',
        `Request to join ${group.subscription_name}?\n\n${phoneNote}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Request',
            onPress: async () => {
              setJoiningId(group.id);
              const { error } = await supabase.from('group_members').insert({
                group_id: group.id,
                user_id: appUser.id,
                status: 'pending',
              });
              setJoiningId(null);
              if (error) {
                if (error.code === '23505') {
                  Alert.alert('Already Requested', 'You already have a request for this group.');
                } else {
                  Alert.alert('Error', 'Could not send request. Please try again.');
                }
              } else {
                Alert.alert('Request Sent! 🎉', 'The owner will review your request shortly.');
              }
            },
          },
        ]
    );
  }, [appUser]);

  const handleAccept = useCallback(async (member: SupabaseMember, group: SupabaseGroup) => {
    setRespondingId(member.id);
    await supabase.from('group_members')
        .update({ status: 'approved', responded_at: new Date().toISOString() })
        .eq('id', member.id);
    const newCount = group.current_members + 1;
    const groupUpdate: Record<string, unknown> = { current_members: newCount };
    if (newCount >= group.max_members) groupUpdate.status = 'full';
    await supabase.from('groups').update(groupUpdate).eq('id', group.id);
    await fireNotification(
        'Request Approved! ✅',
        `Your request to join ${group.subscription_name} was approved! Contact owner at ${appUser?.phone ?? 'N/A'}.`
    );
    if (appUser) await fetchMyGroups(appUser.id);
    setRespondingId(null);
  }, [appUser, fetchMyGroups]);

  const handleReject = useCallback(async (member: SupabaseMember, group: SupabaseGroup) => {
    setRespondingId(member.id);
    await supabase.from('group_members')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('id', member.id);
    await fireNotification('Request Update', `Your request to join ${group.subscription_name} was not approved this time.`);
    if (appUser) await fetchMyGroups(appUser.id);
    setRespondingId(null);
  }, [appUser, fetchMyGroups]);

  const filteredGroups = openGroups.filter((g) => {
    const q = searchQuery.trim().toLowerCase();
    return q === '' || g.subscription_name.toLowerCase().includes(q) || g.unique_code.toLowerCase().includes(q);
  });

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderGroupCard = ({ item: group }: { item: SupabaseGroup }) => {
    const ownerFirstName = group.owner?.full_name?.split(' ')[0] ?? 'Owner';
    const ownerInitial = ownerFirstName[0]?.toUpperCase() ?? '?';
    const isJoining = joiningId === group.id;
    const isFull = group.current_members >= group.max_members;
    const isOwn = group.owner_id === appUser?.id;

    return (
        <Pressable
            style={[styles.card, isFull && styles.cardDimmed]}
            onPress={() => {
              if (isFull) { Alert.alert('Group Full', 'This group is no longer accepting members.'); return; }
              if (isOwn) { Alert.alert('Your Group', 'You cannot join your own group.'); return; }
              handleJoinRequest(group);
            }}
        >
          <View style={[styles.cardStrip, { backgroundColor: group.card_color }]}>
            <Text style={styles.cardEmoji}>{group.emoji}</Text>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{group.unique_code}</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardName} numberOfLines={1}>{group.subscription_name}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{group.description}</Text>
            <View style={styles.cardFooter}>
              <View style={styles.ownerRow}>
                <View style={styles.ownerAvatar}>
                  <Text style={styles.ownerInitial}>{ownerInitial}</Text>
                </View>
                <Text style={styles.ownerName}>{ownerFirstName}</Text>
              </View>
              <View style={styles.dotsRow}>
                {Array.from({ length: group.max_members }).map((_, i) => (
                    <View key={i} style={[styles.dot, i < group.current_members ? styles.dotFilled : styles.dotEmpty]} />
                ))}
              </View>
            </View>
            <View style={styles.regionBadge}>
              <Text style={styles.regionText}>📍 {group.region}</Text>
            </View>
          </View>
          {isJoining && (
              <View style={styles.cardOverlay}>
                <ActivityIndicator color={colors.primary} />
              </View>
          )}
        </Pressable>
    );
  };

  const renderRequest = (member: SupabaseMember, group: SupabaseGroup) => {
    const isResponding = respondingId === member.id;
    const reqUser = member.user;
    return (
        <View key={member.id} style={styles.requestCard}>
          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>{reqUser?.full_name ?? 'Unknown'}</Text>
            <Text style={styles.requestEmail}>{maskEmail(reqUser?.email ?? '')}</Text>
            {reqUser?.phone
                ? <Text style={styles.requestPhone}>📞 {reqUser.phone}</Text>
                : <Text style={styles.requestPhoneMissing}>No phone saved</Text>
            }
            <Text style={styles.requestTime}>{timeAgo(member.requested_at)}</Text>
          </View>
          <View style={styles.requestActions}>
            {isResponding ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                <>
                  <Pressable style={styles.acceptBtn} onPress={() => handleAccept(member, group)}>
                    <Text style={styles.acceptText}>Accept</Text>
                  </Pressable>
                  <Pressable style={styles.rejectBtn} onPress={() => handleReject(member, group)}>
                    <Text style={styles.rejectText}>Reject</Text>
                  </Pressable>
                </>
            )}
          </View>
        </View>
    );
  };

  const renderOwnedGroup = (group: SupabaseGroup) => {
    const requests = pendingMembers[group.id] ?? [];
    return (
        <View key={group.id} style={styles.ownedCard}>
          <View style={[styles.ownedStrip, { backgroundColor: group.card_color }]}>
            <Text style={styles.cardEmoji}>{group.emoji}</Text>
            <View style={styles.ownedMeta}>
              <Text style={styles.ownedName} numberOfLines={1}>{group.subscription_name}</Text>
              <Text style={styles.ownedCode}>{group.unique_code}</Text>
            </View>
            <View style={styles.spotsChip}>
              <Text style={styles.spotsText}>{group.current_members}/{group.max_members}</Text>
            </View>
          </View>
          {requests.length === 0
              ? <View style={styles.noRequests}><Text style={styles.noRequestsText}>No pending requests</Text></View>
              : (
                  <View style={styles.requestsList}>
                    <Text style={styles.requestsHeading}>
                      {requests.length} pending {requests.length === 1 ? 'request' : 'requests'}
                    </Text>
                    {requests.map((m) => renderRequest(m, group))}
                  </View>
              )
          }
        </View>
    );
  };

  const renderJoinedGroup = (group: SupabaseGroup) => {
    const ownerName = group.owner?.full_name ?? 'Owner';
    const ownerPhone = group.owner?.phone;
    return (
        <View key={group.id} style={styles.joinedCard}>
          <View style={[styles.joinedStrip, { backgroundColor: group.card_color }]}>
            <Text style={styles.cardEmoji}>{group.emoji}</Text>
          </View>
          <View style={styles.joinedBody}>
            <Text style={styles.cardName} numberOfLines={1}>{group.subscription_name}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{group.description}</Text>
            <Text style={styles.ownerContact}>
              {ownerName}{ownerPhone ? ` · 📞 ${ownerPhone}` : ''}
            </Text>
          </View>
        </View>
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Connecting to Groups...</Text>
          </View>
        </SafeAreaView>
    );
  }

  const effectiveRegion = appUser?.region ?? region ?? 'United States';

  // ── Main render ───────────────────────────────────────────────────────────
  return (
      <SafeAreaView style={styles.safe}>
        <PhoneSetupModal visible={showPhoneModal} onClose={() => setShowPhoneModal(false)} />

        {/* ✅ Always mounted — no appUser guard */}
        <CreateGroupModal
            visible={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreated={() => fetchOpenGroups(effectiveRegion)}
            appUserId={appUser?.id ?? ''}
            region={effectiveRegion}
        />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Groups</Text>
            <Text style={styles.subtitle}>Share subscription costs</Text>
          </View>
          <Pressable style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.createBtnText}>+ Create</Text>
          </Pressable>
        </View>

        {/* Sub-tabs */}
        <View style={styles.tabRow}>
          <Pressable
              style={[styles.tabBtn, activeTab === 'discover' && styles.tabBtnActive]}
              onPress={() => setActiveTab('discover')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'discover' && styles.tabBtnTextActive]}>
              🔍 Discover
            </Text>
          </Pressable>
          <Pressable
              style={[styles.tabBtn, activeTab === 'myGroups' && styles.tabBtnActive]}
              onPress={() => setActiveTab('myGroups')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'myGroups' && styles.tabBtnTextActive]}>
              👤 My Groups
            </Text>
          </Pressable>
        </View>

        {/* Discover tab */}
        {activeTab === 'discover' && (
            <>
              <View style={styles.searchWrap}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or code e.g. NF-4X2K"
                    placeholderTextColor="rgba(8,17,38,0.35)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                />
              </View>
              <Text style={styles.regionNote}>
                📍 Showing groups in{' '}
                <Text style={{ fontFamily: 'sans-bold' }}>{effectiveRegion}</Text>
              </Text>
              <FlatList
                  data={filteredGroups}
                  keyExtractor={(item) => item.id}
                  renderItem={renderGroupCard}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyIcon}>🔍</Text>
                      <Text style={styles.emptyTitle}>No groups found</Text>
                      <Text style={styles.emptySubtitle}>
                        {searchQuery.trim()
                            ? 'Try a different name or code.'
                            : 'No open groups in your region yet. Be the first!'}
                      </Text>
                      <Pressable style={styles.createFirstBtn} onPress={() => setShowCreateModal(true)}>
                        <Text style={styles.createFirstBtnText}>+ Create a Group</Text>
                      </Pressable>
                    </View>
                  }
              />
            </>
        )}

        {/* My Groups tab */}
        {activeTab === 'myGroups' && (
            <ScrollView
                contentContainerStyle={styles.myGroupsContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                }
            >
              {ownedGroups.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Groups I Own</Text>
                    {ownedGroups.map(renderOwnedGroup)}
                  </View>
              )}
              {joinedGroups.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Groups I Joined</Text>
                    {joinedGroups.map(renderJoinedGroup)}
                  </View>
              )}
              {ownedGroups.length === 0 && joinedGroups.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>👥</Text>
                    <Text style={styles.emptyTitle}>No groups yet</Text>
                    <Text style={styles.emptySubtitle}>Discover open groups or create your own.</Text>
                    <Pressable style={styles.createFirstBtn} onPress={() => setShowCreateModal(true)}>
                      <Text style={styles.createFirstBtnText}>+ Create a Group</Text>
                    </Pressable>
                  </View>
              )}
            </ScrollView>
        )}
      </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontFamily: 'sans-medium', fontSize: 13, color: colors.mutedForeground },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontFamily: 'sans-extrabold', fontSize: 28, color: colors.foreground },
  subtitle: { fontFamily: 'sans-medium', fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  createBtn: { backgroundColor: colors.accent, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4 },
  createBtnText: { fontFamily: 'sans-bold', fontSize: 14, color: '#fff' },
  tabRow: { flexDirection: 'row', backgroundColor: colors.muted, borderRadius: 12, padding: 4, marginHorizontal: 20, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.primary },
  tabBtnText: { fontFamily: 'sans-semibold', fontSize: 14, color: colors.mutedForeground },
  tabBtnTextActive: { color: '#ffffff' },
  searchWrap: { marginHorizontal: 20, marginBottom: 6 },
  searchInput: { backgroundColor: colors.muted, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'sans-regular', fontSize: 15, color: colors.foreground },
  regionNote: { fontFamily: 'sans-medium', fontSize: 13, color: colors.mutedForeground, marginHorizontal: 20, marginBottom: 10 },
  listContent: { paddingTop: 4, paddingBottom: 120 },
  card: { marginHorizontal: 20, marginBottom: 14, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card },
  cardDimmed: { opacity: 0.55 },
  cardStrip: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  cardEmoji: { fontSize: 34 },
  codeBadge: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  codeText: { fontFamily: 'sans-bold', fontSize: 12, color: colors.foreground, letterSpacing: 1.2 },
  cardBody: { backgroundColor: colors.card, padding: 16 },
  cardName: { fontFamily: 'sans-bold', fontSize: 17, color: colors.foreground },
  cardDesc: { fontFamily: 'sans-regular', fontSize: 13, color: colors.mutedForeground, marginTop: 4, lineHeight: 19 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  ownerAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  ownerInitial: { fontFamily: 'sans-bold', fontSize: 12, color: '#ffffff' },
  ownerName: { fontFamily: 'sans-medium', fontSize: 13, color: colors.foreground },
  dotsRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotFilled: { backgroundColor: colors.primary },
  dotEmpty: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  regionBadge: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: colors.muted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  regionText: { fontFamily: 'sans-medium', fontSize: 11, color: colors.mutedForeground },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,249,227,0.72)', alignItems: 'center', justifyContent: 'center' },
  myGroupsContent: { paddingTop: 12, paddingBottom: 120 },
  section: { marginBottom: 28 },
  sectionTitle: { fontFamily: 'sans-bold', fontSize: 17, color: colors.foreground, marginHorizontal: 20, marginBottom: 12 },
  ownedCard: { marginHorizontal: 20, marginBottom: 14, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card },
  ownedStrip: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  ownedMeta: { flex: 1 },
  ownedName: { fontFamily: 'sans-bold', fontSize: 15, color: colors.foreground },
  ownedCode: { fontFamily: 'sans-regular', fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  spotsChip: { backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  spotsText: { fontFamily: 'sans-bold', fontSize: 13, color: colors.foreground },
  noRequests: { paddingVertical: 14, alignItems: 'center' },
  noRequestsText: { fontFamily: 'sans-regular', fontSize: 13, color: colors.mutedForeground },
  requestsList: { padding: 12, gap: 8 },
  requestsHeading: { fontFamily: 'sans-semibold', fontSize: 13, color: colors.foreground, marginBottom: 8 },
  requestCard: { backgroundColor: colors.muted, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  requestInfo: { flex: 1, gap: 2 },
  requestName: { fontFamily: 'sans-semibold', fontSize: 14, color: colors.foreground },
  requestEmail: { fontFamily: 'sans-regular', fontSize: 12, color: colors.mutedForeground },
  requestPhone: { fontFamily: 'sans-medium', fontSize: 13, color: colors.accent },
  requestPhoneMissing: { fontFamily: 'sans-regular', fontSize: 12, color: colors.mutedForeground, fontStyle: 'italic' },
  requestTime: { fontFamily: 'sans-regular', fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  requestActions: { gap: 7, alignItems: 'stretch' },
  acceptBtn: { backgroundColor: colors.success, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7, alignItems: 'center' },
  acceptText: { fontFamily: 'sans-bold', fontSize: 13, color: '#ffffff' },
  rejectBtn: { backgroundColor: colors.destructive, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7, alignItems: 'center' },
  rejectText: { fontFamily: 'sans-bold', fontSize: 13, color: '#ffffff' },
  joinedCard: { marginHorizontal: 20, marginBottom: 14, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card, flexDirection: 'row' },
  joinedStrip: { width: 68, alignItems: 'center', justifyContent: 'center' },
  joinedBody: { flex: 1, padding: 14 },
  ownerContact: { fontFamily: 'sans-medium', fontSize: 12, color: colors.accent, marginTop: 8 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: 'sans-bold', fontSize: 18, color: colors.foreground, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontFamily: 'sans-regular', fontSize: 14, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  createFirstBtn: { marginTop: 20, backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  createFirstBtnText: { fontFamily: 'sans-bold', fontSize: 14, color: '#fff' },
});