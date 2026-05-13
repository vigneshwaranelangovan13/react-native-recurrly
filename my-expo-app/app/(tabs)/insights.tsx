// app/(tabs)/insights.tsx
import '@/global.css';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { icons } from '@/constants/icons';
import { colors } from '@/constants/theme';
import { formatCurrency } from '@/lib/utils';
import dayjs from 'dayjs';
import { useSubscriptionStore } from '@/lib/subscriptionStore';

const CHART_HEIGHT = 140;
const Y_LABELS = [45, 35, 25, 15, 5];

function BarChart({ data }: { data: { day: string; amount: number }[] }) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  return (
      <View style={styles.chartWrapper}>
        <View style={{ flexDirection: 'row' }}>
          <View style={styles.yAxis}>
            {Y_LABELS.map((label) => (
                <Text key={label} style={styles.yLabel}>{label}</Text>
            ))}
          </View>
          <View style={styles.barsContainer}>
            {data.map((item) => {
              const barHeight = (item.amount / maxAmount) * CHART_HEIGHT;
              const isHighlighted = item.amount === maxAmount && item.amount > 0;
              return (
                  <View key={item.day} style={styles.barColumn}>
                    <Text style={[styles.barLabel, { opacity: isHighlighted ? 1 : 0 }]}>
                      ${Math.round(item.amount)}
                    </Text>
                    <View style={{ height: CHART_HEIGHT, justifyContent: 'flex-end' }}>
                      <View
                          style={[
                            styles.bar,
                            {
                              height: Math.max(barHeight, 4),
                              backgroundColor: isHighlighted ? colors.accent : colors.primary,
                            },
                          ]}
                      />
                    </View>
                    <Text style={styles.xLabel}>{item.day}</Text>
                  </View>
              );
            })}
          </View>
        </View>
      </View>
  );
}

// ✅ Replaced icon with colored initial circle — letter in black
function HistoryInitial({ name, color }: { name: string; color?: string }) {
  return (
      <View style={[styles.historyIconWrap, { backgroundColor: color ?? '#d4d4d4' }]}>
        <Text style={styles.historyInitialText}>
          {name?.charAt(0)?.toUpperCase() ?? '?'}
        </Text>
      </View>
  );
}

function HistoryItem({ name, color, date, price, period }: any) {
  return (
      <View style={styles.historyCard}>
        <View style={styles.historyLeft}>
          <HistoryInitial name={name} color={color} />
          <View>
            <Text style={styles.historyName}>{name}</Text>
            <Text style={styles.historyDate}>{date}</Text>
          </View>
        </View>
        <View style={styles.historyRight}>
          <Text style={styles.historyPrice}>{formatCurrency(price)}</Text>
          <Text style={styles.historyPeriod}>{period}</Text>
        </View>
      </View>
  );
}

export default function InsightsScreen() {
  const router = useRouter();
  const { subscriptions } = useSubscriptionStore();

  const monthlyTotal = useMemo(() => {
    return subscriptions
        .filter((s) => s.status === 'active')
        .reduce((sum, s) => {
          return sum + (s.billing === 'Yearly' ? s.price / 12 : s.price);
        }, 0);
  }, [subscriptions]);

  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map((day) => ({ day, amount: 0 }));
    subscriptions
        .filter((s) => s.status === 'active')
        .forEach((sub) => {
          const dayIndex = dayjs(sub.renewalDate).day();
          const monthly = sub.billing === 'Yearly' ? sub.price / 12 : sub.price;
          data[dayIndex].amount += monthly;
        });
    const mon = data.shift()!;
    data.push(mon);
    return data;
  }, [subscriptions]);

  const historyData = useMemo(() => {
    return subscriptions.slice(0, 5).map((sub) => ({
      id: sub.id,
      name: sub.name,
      color: sub.color,   // ✅ pass color for initial circle
      date: dayjs(sub.startDate).format('MMMM DD, HH:mm'),
      price: sub.price,
      period: 'per month',
    }));
  }, [subscriptions]);

  const currentMonth = dayjs().format('MMMM YYYY');

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={12}>
            <Image source={icons.back} style={styles.headerIcon} resizeMode="contain" />
          </Pressable>
          <Text style={styles.headerTitle}>Monthly Insights</Text>
          <Pressable hitSlop={12}>
            <Image source={icons.menu} style={styles.headerIcon} resizeMode="contain" />
          </Pressable>
        </View>

        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <Pressable>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <BarChart data={weeklyData} />
          </View>

          <View style={[styles.card, styles.expensesCard]}>
            <View>
              <Text style={styles.expensesLabel}>Expenses</Text>
              <Text style={styles.expensesMonth}>{currentMonth}</Text>
            </View>
            <View style={styles.expensesRight}>
              <Text style={styles.expensesAmount}>-{formatCurrency(monthlyTotal)}</Text>
              <Text style={styles.expensesChange}>+0%</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>History</Text>
            <Pressable>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>

          {historyData.length === 0 ? (
              <Text style={styles.emptyText}>No subscriptions yet.</Text>
          ) : (
              historyData.map((item) => (
                  <HistoryItem key={item.id} {...item} />
              ))
          )}

        </ScrollView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerIcon: { width: 28, height: 28 },
  headerTitle: { fontSize: 20, fontFamily: 'sans-bold', color: colors.primary },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 20, fontFamily: 'sans-bold', color: colors.primary },
  viewAll: { fontSize: 14, fontFamily: 'sans-semibold', color: colors.mutedForeground },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartWrapper: { paddingTop: 8 },
  yAxis: {
    width: 28,
    height: CHART_HEIGHT + 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingTop: 20,
  },
  yLabel: {
    fontSize: 10,
    fontFamily: 'sans-medium',
    color: colors.mutedForeground,
    textAlign: 'right',
  },
  barsContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end' },
  barColumn: { flex: 1, alignItems: 'center' },
  barLabel: {
    fontSize: 11,
    fontFamily: 'sans-bold',
    color: colors.accent,
    marginBottom: 4,
  },
  bar: { width: 20, borderRadius: 6 },
  xLabel: {
    fontSize: 10,
    fontFamily: 'sans-medium',
    color: colors.mutedForeground,
    marginTop: 6,
  },
  expensesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expensesLabel: { fontSize: 16, fontFamily: 'sans-bold', color: colors.primary },
  expensesMonth: {
    fontSize: 13,
    fontFamily: 'sans-medium',
    color: colors.mutedForeground,
    marginTop: 2,
  },
  expensesRight: { alignItems: 'flex-end' },
  expensesAmount: { fontSize: 20, fontFamily: 'sans-extrabold', color: colors.primary },
  expensesChange: {
    fontSize: 13,
    fontFamily: 'sans-semibold',
    color: colors.success,
    marginTop: 2,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInitialText: {
    fontSize: 20,
    fontFamily: 'sans-bold',
    color: '#000000', // ✅ black letter
  },
  historyName: { fontSize: 15, fontFamily: 'sans-bold', color: colors.primary },
  historyDate: {
    fontSize: 12,
    fontFamily: 'sans-medium',
    color: colors.mutedForeground,
    marginTop: 2,
  },
  historyRight: { alignItems: 'flex-end' },
  historyPrice: { fontSize: 16, fontFamily: 'sans-bold', color: colors.primary },
  historyPeriod: {
    fontSize: 12,
    fontFamily: 'sans-medium',
    color: colors.mutedForeground,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 14,
    marginTop: 20,
  },
});