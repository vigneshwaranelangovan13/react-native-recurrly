import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const ListHeading = ({ title, actionLabel, onAction }: ListHeadingProps) => {
    const router = useRouter();

    const handleViewAll = () => {
        router.push('/(tabs)/subscriptions');
    };

    return (
        <View className="list-head">
            <Text className="list-title">{title}</Text>

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {/* ✅ View all — redirects to subscriptions tab */}
                <TouchableOpacity className="list-action" onPress={handleViewAll}>
                    <Text className="list-action-text">View all</Text>
                </TouchableOpacity>

                {/* ✅ + Add button — only shows if actionLabel passed */}
                {actionLabel && (
                    <TouchableOpacity className="list-action" onPress={onAction}>
                        <Text className="list-action-text">{actionLabel}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default ListHeading;