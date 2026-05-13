// components/CreditCardDueCard.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import dayjs from 'dayjs';
import { colors } from '@/constants/theme';
import { CreditCard } from './AddCreditCardModal';

interface Props extends CreditCard {
    onRemove: (id: string) => void;
}

function getDaysUntilBilling(billingDay: number): number {
    const now = dayjs();
    let next = now.date(billingDay);
    if (next.isBefore(now, 'day') || next.isSame(now, 'day')) {
        next = next.add(1, 'month');
    }
    return next.diff(now, 'day');
}

export default function CreditCardDueCard({ id, name, lastFour, billingDay, color, onRemove }: Props) {
    const daysLeft = getDaysUntilBilling(billingDay);
    const isUrgent = daysLeft <= 3;

    return (
        <View style={[styles.card, { backgroundColor: color }]}>
            {/* Card chip icon */}
            <View style={styles.chip} />

            <Text style={styles.cardName}>{name}</Text>
            <Text style={styles.lastFour}>•••• {lastFour}</Text>

            <View style={styles.footer}>
                <View>
                    <Text style={styles.dueLabel}>Due in</Text>
                    <Text style={[styles.daysLeft, isUrgent && styles.urgent]}>
                        {daysLeft === 0 ? 'Today!' : `${daysLeft} days`}
                    </Text>
                </View>
                <Pressable onPress={() => onRemove(id)} hitSlop={8}>
                    <Text style={styles.removeText}>✕</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: 160,
        borderRadius: 20,
        padding: 16,
        marginRight: 12,
        gap: 4,
    },
    chip: {
        width: 28,
        height: 20,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginBottom: 8,
    },
    cardName: {
        fontSize: 14,
        fontFamily: 'sans-bold',
        color: colors.primary,
    },
    lastFour: {
        fontSize: 13,
        fontFamily: 'sans-medium',
        color: colors.primary,
        opacity: 0.7,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    dueLabel: {
        fontSize: 11,
        fontFamily: 'sans-medium',
        color: colors.primary,
        opacity: 0.6,
    },
    daysLeft: {
        fontSize: 16,
        fontFamily: 'sans-extrabold',
        color: colors.primary,
    },
    urgent: {
        color: colors.destructive,
    },
    removeText: {
        fontSize: 14,
        color: colors.primary,
        opacity: 0.5,
        fontFamily: 'sans-bold',
    },
});