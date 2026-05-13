// app/onboarding-quiz.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { useState } from 'react';

const TOTAL_STEPS = 10;

type Screen =
    | { type: 'quiz'; emoji: string; tag: string; question: string; options: string[] }
    | { type: 'fact'; emoji: string; tag: string; stat: string; statLabel: string; body: string; punch: string; cta: string }
    | { type: 'hero'; emoji: string; tag: string; stat: string; statLabel: string; fear: string; solution: string; solutionBody: string; punch: string; cta: string }
    | { type: 'sharing'; emoji: string; tag: string; soloPrice: string; sharedPrice: string; saving: string; solution: string; solutionBody: string; cta: string };

const SCREENS: Screen[] = [
    {
        type: 'quiz',
        emoji: '🤔',
        tag: 'Quick question',
        question: 'How many subscriptions do you currently pay for?',
        options: ['Less than 3', '3 to 6', '7 or more', 'No idea 😅'],
    },
    {
        type: 'fact',
        emoji: '😱',
        tag: 'Did you know?',
        stat: '6–8',
        statLabel: 'subscriptions paid per month',
        body: 'The average Indian pays for 6–8 subscriptions every month...\n\nbut actively uses only 2–3.',
        punch: "You're paying for ghosts. 👻",
        cta: 'Wow, really? →',
    },
    {
        type: 'quiz',
        emoji: '😬',
        tag: 'Be honest...',
        question: 'Have you ever missed a credit card due date?',
        options: ["Never, I'm careful", 'Once or twice', "More than I'd admit 😓", "I don't even check"],
    },
    {
        type: 'fact',
        emoji: '💳',
        tag: "That's a lot of money",
        stat: '₹3,500 Cr+',
        statLabel: 'in late fees paid every year in India',
        body: 'Average late fee?\n₹500–₹1,000 per missed payment.',
        punch: 'One missed date = 1 month of OTT. Just gone. 😤',
        cta: "That's scary →",
    },
    {
        type: 'quiz',
        emoji: '🎯',
        tag: 'Last one...',
        question: 'How do you currently track your subscriptions?',
        options: ['Notes / Spreadsheet', 'My bank statements', 'I just remember 🤞', "I don't track them"],
    },
    {
        type: 'hero',
        emoji: '🔥',
        tag: 'The real cost',
        stat: '₹28,000+',
        statLabel: 'wasted per year on forgotten subscriptions',
        fear: "That's ₹2,300+ every single month. Just gone. 💸",
        solution: 'Not anymore.',
        solutionBody: 'Recurrly tracks every subscription, every due date, every rupee — all in one place.',
        punch: 'Stress-free. ✅',
        cta: "Let's fix this →",
    },
    {
        type: 'quiz',
        emoji: '🤝',
        tag: 'Ever thought about this?',
        question: 'Do you share subscriptions with friends or family?',
        options: ['Yes, I already share', 'No, I pay alone', "I want to but don't know how", 'Never thought about it'],
    },
    {
        type: 'sharing',
        emoji: '💸',
        tag: 'Split and save',
        soloPrice: '₹649/mo',
        sharedPrice: '₹216/mo',
        saving: '₹5,196 saved every year — per person. 🤑',
        solution: 'Recurrly does this.',         // ✅ solution like hero screen
        solutionBody: 'Share subscriptions, split costs and track who owes what — all in one place. 🙌',
        cta: 'I want to save →',
    },
];

export default function OnboardingQuiz() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const currentScreen = SCREENS[step];
    const dotIndex = step + 1;

    const goNext = () => {
        setSelectedOption(null);
        if (step < SCREENS.length - 1) {
            setStep(step + 1);
        } else {
            router.push('/onboarding-currency');
        }
    };

    const handleOptionSelect = (index: number) => {
        setSelectedOption(index);
        setTimeout(() => goNext(), 600);
    };

    const renderDots = () => (
        <View style={styles.dotsRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View key={i} style={[styles.dot, i === dotIndex && styles.dotActive]} />
            ))}
        </View>
    );

    const renderQuiz = (screen: Extract<Screen, { type: 'quiz' }>) => (
        <SafeAreaView style={styles.container}>
            {renderDots()}
            <View style={styles.content}>
                <Text style={styles.emoji}>{screen.emoji}</Text>
                <Text style={styles.tag}>{screen.tag}</Text>
                <Text style={styles.question}>{screen.question}</Text>
                <View style={styles.optionsWrap}>
                    {screen.options.map((opt, i) => (
                        <Pressable
                            key={i}
                            style={[styles.option, selectedOption === i && styles.optionSelected]}
                            onPress={() => handleOptionSelect(i)}>
                            <Text style={[styles.optionText, selectedOption === i && styles.optionTextSelected]}>
                                {opt}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );

    const renderFact = (screen: Extract<Screen, { type: 'fact' }>) => (
        <SafeAreaView style={styles.container}>
            {renderDots()}
            <View style={styles.content}>
                <Text style={styles.emoji}>{screen.emoji}</Text>
                <Text style={styles.tag}>{screen.tag}</Text>
                <Text style={styles.statBig}>{screen.stat}</Text>
                <Text style={styles.statLabel}>{screen.statLabel}</Text>
                <Text style={styles.factBody}>{screen.body}</Text>
                <Text style={styles.punch}>{screen.punch}</Text>
            </View>
            <Pressable style={styles.button} onPress={goNext}>
                <Text style={styles.buttonText}>{screen.cta}</Text>
            </Pressable>
        </SafeAreaView>
    );

    const renderHero = (screen: Extract<Screen, { type: 'hero' }>) => (
        <SafeAreaView style={styles.container}>
            {renderDots()}
            <View style={styles.content}>
                <Text style={styles.emoji}>{screen.emoji}</Text>
                <Text style={styles.tag}>{screen.tag}</Text>
                <Text style={styles.statBig}>{screen.stat}</Text>
                <Text style={styles.statLabel}>{screen.statLabel}</Text>
                <Text style={styles.factBody}>{screen.fear}</Text>
                <View style={styles.divider} />
                <Text style={styles.solutionTitle}>{screen.solution}</Text>
                <Text style={styles.solutionBody}>{screen.solutionBody}</Text>
                <Text style={styles.punch}>{screen.punch}</Text>
            </View>
            <Pressable style={styles.button} onPress={goNext}>
                <Text style={styles.buttonText}>{screen.cta}</Text>
            </Pressable>
        </SafeAreaView>
    );

    const renderSharing = (screen: Extract<Screen, { type: 'sharing' }>) => (
        <SafeAreaView style={styles.container}>
            {renderDots()}
            <View style={styles.content}>
                <Text style={styles.emoji}>{screen.emoji}</Text>
                <Text style={styles.tag}>{screen.tag}</Text>
                <Text style={styles.question}>Netflix alone costs you...</Text>

                {/* Compare box */}
                <View style={styles.compareRow}>
                    <View style={styles.compareBox}>
                        <Text style={styles.compareLabel}>Solo</Text>
                        <Text style={styles.comparePrice}>{screen.soloPrice}</Text>
                    </View>
                    <View style={styles.compareDivider} />
                    <View style={styles.compareBox}>
                        <Text style={styles.compareLabel}>With 2 friends</Text>
                        <Text style={[styles.comparePrice, styles.comparePriceSave]}>
                            {screen.sharedPrice}
                        </Text>
                    </View>
                </View>

                {/* Big saving */}
                <Text style={styles.punch}>{screen.saving}</Text>

                {/* ✅ Solution section — same style as hero screen */}
                <View style={styles.divider} />
                <Text style={styles.solutionTitle}>{screen.solution}</Text>
                <Text style={styles.solutionBody}>{screen.solutionBody}</Text>
            </View>
            <Pressable style={styles.button} onPress={goNext}>
                <Text style={styles.buttonText}>{screen.cta}</Text>
            </Pressable>
        </SafeAreaView>
    );

    if (currentScreen.type === 'quiz') return renderQuiz(currentScreen);
    if (currentScreen.type === 'fact') return renderFact(currentScreen);
    if (currentScreen.type === 'hero') return renderHero(currentScreen);
    if (currentScreen.type === 'sharing') return renderSharing(currentScreen);
    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        paddingTop: 12,
        paddingBottom: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.border,
    },
    dotActive: {
        width: 18,
        borderRadius: 3,
        backgroundColor: colors.accent,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 100,
    },
    emoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    tag: {
        fontSize: 13,
        fontFamily: 'sans-semibold',
        color: colors.accent,
        marginBottom: 10,
        letterSpacing: 0.3,
    },
    question: {
        fontSize: 26,
        fontFamily: 'sans-extrabold',
        color: colors.primary,
        lineHeight: 34,
        marginBottom: 20,
    },
    optionsWrap: {
        gap: 12,
    },
    option: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.card,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    optionSelected: {
        borderColor: colors.accent,
        backgroundColor: 'rgba(234,122,83,0.08)',
    },
    optionText: {
        fontSize: 16,
        fontFamily: 'sans-semibold',
        color: colors.primary,
    },
    optionTextSelected: {
        color: colors.accent,
    },
    statBig: {
        fontSize: 52,
        fontFamily: 'sans-extrabold',
        color: colors.accent,
        lineHeight: 56,
        marginBottom: 6,
    },
    statLabel: {
        fontSize: 15,
        fontFamily: 'sans-medium',
        color: colors.mutedForeground,
        marginBottom: 20,
    },
    factBody: {
        fontSize: 16,
        fontFamily: 'sans-medium',
        color: colors.primary,
        lineHeight: 26,
        marginBottom: 16,
    },
    punch: {
        fontSize: 18,
        fontFamily: 'sans-bold',
        color: colors.primary,
        lineHeight: 26,
        marginBottom: 4,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 20,
    },
    solutionTitle: {
        fontSize: 28,
        fontFamily: 'sans-extrabold',
        color: colors.primary,
        marginBottom: 10,
    },
    solutionBody: {
        fontSize: 16,
        fontFamily: 'sans-medium',
        color: colors.mutedForeground,
        lineHeight: 26,
        marginBottom: 12,
    },
    compareRow: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    compareBox: {
        flex: 1,
        alignItems: 'center',
    },
    compareDivider: {
        width: 1,
        height: 60,
        backgroundColor: colors.border,
        marginHorizontal: 12,
    },
    compareLabel: {
        fontSize: 15,
        fontFamily: 'sans-semibold',
        color: colors.mutedForeground,
        marginBottom: 8,
    },
    comparePrice: {
        fontSize: 36,
        fontFamily: 'sans-extrabold',
        color: colors.primary,
    },
    comparePriceSave: {
        color: '#16a34a',
    },
    button: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: colors.accent,
        height: 56,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 17,
        fontFamily: 'sans-bold',
        color: '#fff',
    },
});