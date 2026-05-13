import { View, Text, Pressable, StyleSheet } from 'react-native';
import React from 'react';
import { formatCurrency, formatStatusLabel, formatSubscriptionDateTime } from '@/lib/utils';
import { colors } from '@/constants/theme';

const SubscriptionCard = ({
                              name, price, currency, billing, color, category,
                              plan, renewalDate, expanded, onPress, paymentMethod,
                              startDate, status, id, onCancel,
                          }: SubscriptionCardProps) => {
    return (
        <Pressable onPress={onPress} style={styles.card}>

            {/* Main row */}
            <View style={styles.row}>
                <View style={styles.left}>
                    {/* Colored initial circle */}
                    <View style={[styles.initial, { backgroundColor: color ?? '#d4d4d4' }]}>
                        <Text style={styles.initialText}>
                            {name?.charAt(0)?.toUpperCase() ?? '?'}
                        </Text>
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.name} numberOfLines={1}>{name}</Text>
                        <Text style={styles.meta} numberOfLines={1}>
                            {category?.trim() || plan?.trim() || (renewalDate ? formatSubscriptionDateTime(renewalDate) : '')}
                        </Text>
                    </View>
                </View>

                <View style={styles.right}>
                    <Text style={styles.price}>{formatCurrency(price, currency)}</Text>
                    <Text style={styles.billing}>{billing}</Text>
                </View>
            </View>

            {/* Expanded details */}
            {expanded && (
                <View style={styles.expanded}>
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                            {paymentMethod?.trim() ?? 'Not provided'}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Category</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                            {(category?.trim() || plan?.trim()) ?? 'Not provided'}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Started</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                            {startDate ? formatSubscriptionDateTime(startDate) : 'Not provided'}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Renewal</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                            {renewalDate ? formatSubscriptionDateTime(renewalDate) : 'Not provided'}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                            {status ? formatStatusLabel(status) : 'Not provided'}
                        </Text>
                    </View>

                    {onCancel && (
                        <Pressable
                            style={styles.removeBtn}
                            onPress={() => onCancel(id)}
                            hitSlop={8}>
                            <Text style={styles.removeText}>✕ Remove Subscription</Text>
                        </Pressable>
                    )}
                </View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card, // ✅ white card — no colored background
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    initial: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialText: {
        fontSize: 20,
        fontFamily: 'sans-bold',
        color: '#000000', // ✅ black letter
    },
    info: { flex: 1 },
    name: {
        fontSize: 15,
        fontFamily: 'sans-bold',
        color: colors.primary,
    },
    meta: {
        fontSize: 12,
        fontFamily: 'sans-medium',
        color: colors.mutedForeground,
        marginTop: 2,
    },
    right: { alignItems: 'flex-end', marginLeft: 12 },
    price: {
        fontSize: 16,
        fontFamily: 'sans-bold',
        color: colors.primary,
    },
    billing: {
        fontSize: 12,
        fontFamily: 'sans-medium',
        color: colors.mutedForeground,
        marginTop: 2,
    },
    expanded: { marginTop: 12 },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
    },
    detailLabel: {
        fontSize: 13,
        fontFamily: 'sans-medium',
        color: colors.mutedForeground,
    },
    detailValue: {
        fontSize: 13,
        fontFamily: 'sans-semibold',
        color: colors.primary,
        maxWidth: '60%',
        textAlign: 'right',
    },
    removeBtn: {
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: 'rgba(220,38,38,0.08)',
        borderWidth: 1.5,
        borderColor: 'rgba(220,38,38,0.2)',
    },
    removeText: {
        fontSize: 14,
        fontFamily: 'sans-semibold',
        color: '#dc2626',
    },
});

export default SubscriptionCard;