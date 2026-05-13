import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import React from 'react';
import { formatCurrency, formatStatusLabel, formatSubscriptionDateTime } from '@/lib/utils';
import clsx from 'clsx';

const SubscriptionCard = ({
                              name, price, currency, icon, billing, color, category,
                              plan, renewalDate, expanded, onPress, paymentMethod,
                              startDate, status, id, onCancel,
                          }: SubscriptionCardProps) => {
    return (
        <Pressable
            onPress={onPress}
            className={clsx('sub-card', expanded ? 'sub-card-expanded' : 'bg-card')}
            style={!expanded && color ? { backgroundColor: color } : undefined}>

            <View className="sub-head">
                <View className="sub-main">
                    {typeof icon === 'number' ? (
                        <Image source={icon} className="sub-icon" />
                    ) : (
                        <Text className="sub-icon">{icon}</Text>
                    )}
                    <View className="sub-copy">
                        <Text numberOfLines={1} className="sub-title">{name}</Text>
                        <Text numberOfLines={1} ellipsizeMode="tail" className="sub-meta">
                            {category?.trim() || plan?.trim() || (renewalDate ? formatSubscriptionDateTime(renewalDate) : '')}
                        </Text>
                    </View>
                </View>

                <View className="sub-price-box">
                    <Text className="sub-price">{formatCurrency(price, currency)}</Text>
                    <Text className="sub-billing">{billing}</Text>
                </View>
            </View>

            {expanded && (
                <View className="sub-bdy">
                    <View className="sub-details">
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Payment:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                                    {paymentMethod?.trim() ?? 'Not provided'}
                                </Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Category:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                                    {(category?.trim() || plan?.trim()) ?? 'Not provided'}
                                </Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Started:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                                    {startDate ? formatSubscriptionDateTime(startDate) : 'Not provided'}
                                </Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Renewal date:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                                    {renewalDate ? formatSubscriptionDateTime(renewalDate) : 'Not provided'}
                                </Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Status:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                                    {status ? formatStatusLabel(status) : 'Not provided'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ✅ Remove button — same style as CreditCardDueCard ✕ */}
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
    removeBtn: {
        marginTop: 16,
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