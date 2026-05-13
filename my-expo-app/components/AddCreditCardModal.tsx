// components/AddCreditCardModal.tsx
import {
    Modal,
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { useState } from 'react';
import { colors } from '@/constants/theme';
import * as Notifications from 'expo-notifications';
import dayjs from 'dayjs';

export interface CreditCard {
    id: string;
    name: string;
    lastFour: string;
    billingDay: number; // 1–31
    color: string;
}

const CARD_COLORS = ['#ea7a53', '#8fd1bd', '#b8d4e3', '#e8def8', '#f5c542', '#95e1d3'];

interface Props {
    visible: boolean;
    onClose: () => void;
    onAdd: (card: CreditCard) => void;
}

async function scheduleCardNotification(card: CreditCard) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    // Cancel existing notifications for this card
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
        if (n.content.data?.cardId === card.id) {
            await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
    }

    // Schedule 3 days before billing date each month
    const now = dayjs();
    let billingDate = now.date(card.billingDay);
    if (billingDate.isBefore(now)) billingDate = billingDate.add(1, 'month');
    const notifyDate = billingDate.subtract(3, 'day').toDate();

    if (notifyDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '💳 Card Bill Due Soon',
                body: `Your ${card.name} (****${card.lastFour}) bill is due in 3 days.`,
                data: { cardId: card.id },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyDate },
        });
    }
}

export default function AddCreditCardModal({ visible, onClose, onAdd }: Props) {
    const [name, setName] = useState('');
    const [lastFour, setLastFour] = useState('');
    const [billingDay, setBillingDay] = useState('');
    const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0]);

    const isValid =
        name.trim().length > 0 &&
        lastFour.length === 4 &&
        /^\d{4}$/.test(lastFour) &&
        Number(billingDay) >= 1 &&
        Number(billingDay) <= 31;

    const handleAdd = async () => {
        if (!isValid) return;
        const card: CreditCard = {
            id: `card-${Date.now()}`,
            name: name.trim(),
            lastFour,
            billingDay: Number(billingDay),
            color: selectedColor,
        };
        await scheduleCardNotification(card);
        onAdd(card);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setName('');
        setLastFour('');
        setBillingDay('');
        setSelectedColor(CARD_COLORS[0]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <Pressable style={styles.overlay} onPress={handleClose}>
                    <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Add Credit Card</Text>
                            <Pressable style={styles.closeBtn} onPress={handleClose}>
                                <Text style={styles.closeText}>✕</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ gap: 20, padding: 20, paddingBottom: 32 }}
                        >
                            {/* Card Name */}
                            <View style={styles.field}>
                                <Text style={styles.label}>Card Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Chase Sapphire, Visa Gold"
                                    placeholderTextColor="rgba(0,0,0,0.4)"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            {/* Last 4 Digits */}
                            <View style={styles.field}>
                                <Text style={styles.label}>Last 4 Digits</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 8530"
                                    placeholderTextColor="rgba(0,0,0,0.4)"
                                    value={lastFour}
                                    onChangeText={(t) => setLastFour(t.replace(/\D/g, '').slice(0, 4))}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                />
                            </View>

                            {/* Billing Day */}
                            <View style={styles.field}>
                                <Text style={styles.label}>Billing Day of Month</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 15 (for the 15th of every month)"
                                    placeholderTextColor="rgba(0,0,0,0.4)"
                                    value={billingDay}
                                    onChangeText={(t) => setBillingDay(t.replace(/\D/g, '').slice(0, 2))}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                                <Text style={styles.hint}>
                                    You'll get a reminder 3 days before this date every month
                                </Text>
                            </View>

                            {/* Color Picker */}
                            <View style={styles.field}>
                                <Text style={styles.label}>Card Color</Text>
                                <View style={styles.colorRow}>
                                    {CARD_COLORS.map((c) => (
                                        <Pressable
                                            key={c}
                                            onPress={() => setSelectedColor(c)}
                                            style={[
                                                styles.colorDot,
                                                { backgroundColor: c },
                                                selectedColor === c && styles.colorDotSelected,
                                            ]}
                                        />
                                    ))}
                                </View>
                            </View>

                            {/* Add Button */}
                            <Pressable
                                style={[styles.addButton, !isValid && styles.addButtonDisabled]}
                                onPress={handleAdd}
                                disabled={!isValid}
                            >
                                <Text style={styles.addButtonText}>Add Card</Text>
                            </Pressable>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 18,
        fontFamily: 'sans-bold',
        color: colors.primary,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        fontSize: 14,
        fontFamily: 'sans-bold',
        color: colors.primary,
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontFamily: 'sans-semibold',
        color: colors.primary,
    },
    input: {
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        fontFamily: 'sans-medium',
        color: colors.primary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    hint: {
        fontSize: 12,
        fontFamily: 'sans-regular',
        color: colors.mutedForeground,
    },
    colorRow: {
        flexDirection: 'row',
        gap: 12,
    },
    colorDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    colorDotSelected: {
        borderWidth: 3,
        borderColor: colors.primary,
    },
    addButton: {
        backgroundColor: colors.accent,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    addButtonDisabled: {
        opacity: 0.45,
    },
    addButtonText: {
        fontSize: 16,
        fontFamily: 'sans-bold',
        color: '#fff',
    },
});