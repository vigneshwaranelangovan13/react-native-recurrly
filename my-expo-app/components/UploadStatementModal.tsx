import {
    Modal, View, Text, Pressable, StyleSheet,
    ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { colors } from '@/constants/theme';
import { useSubscriptionStore } from '@/lib/subscriptionStore';
import { useCurrencyStore } from '@/lib/currencyStore';
import dayjs from 'dayjs';

const CATEGORY_COLORS: Record<string, string> = {
    Entertainment: '#ff6b6b',
    'AI Tools': '#b8d4e3',
    'Developer Tools': '#e8def8',
    Design: '#f5c542',
    Productivity: '#95e1d3',
    Other: '#d4d4d4',
};

interface ExtractedSubscription {
    name: string;
    price: number;
    currency: string;
    billing: 'Monthly' | 'Yearly';
    category: string;
    selected: boolean;
}

interface Props {
    visible: boolean;
    onClose: () => void;
}

type Step = 'pick' | 'scanning' | 'preview';

export default function UploadStatementModal({ visible, onClose }: Props) {
    const { addSubscription } = useSubscriptionStore();
    const { currencyCode } = useCurrencyStore();

    const [step, setStep] = useState<Step>('pick');
    const [found, setFound] = useState<ExtractedSubscription[]>([]);

    const resetAndClose = () => {
        console.log('[UploadModal] closing and resetting state');
        setStep('pick');
        setFound([]);
        onClose();
    };

    const scanWithGPT = async (base64: string, mimeType: string) => {
        console.log('[scanWithGPT] starting scan');
        console.log('[scanWithGPT] mimeType:', mimeType);
        console.log('[scanWithGPT] base64 length:', base64.length);
        console.log('[scanWithGPT] is image?', mimeType.startsWith('image/'));

        setStep('scanning');

        const isImage = mimeType.startsWith('image/');

        const contentParts: any[] = [
            {
                type: 'text',
                text: `Extract all recurring subscription charges from this ${isImage ? 'screenshot' : 'bank statement PDF'}.
Return ONLY a valid JSON array, no markdown, no explanation, no code fences.
Each item must have:
- name: string (e.g. "Netflix", "Spotify")
- price: number (amount charged)
- currency: string (e.g. "USD", "INR")
- billing: "Monthly" or "Yearly"
- category: one of "Entertainment", "AI Tools", "Developer Tools", "Design", "Productivity", "Other"

If nothing found return [].

Example: [{"name":"Netflix","price":15.99,"currency":"USD","billing":"Monthly","category":"Entertainment"}]`,
            },
        ];

        if (isImage) {
            console.log('[scanWithGPT] adding image_url content part');
            contentParts.push({
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64}` },
            });
        } else {
            console.log('[scanWithGPT] adding PDF file content part');
            contentParts.push({
                type: 'file',
                file: {
                    filename: 'bank_statement.pdf',
                    file_data: `data:application/pdf;base64,${base64}`,
                },
            });
        }

        try {
            console.log('[scanWithGPT] sending request to OpenAI API...');
            console.log('[scanWithGPT] model: gpt-4o');
            console.log('[scanWithGPT] API key present?', !!process.env.EXPO_PUBLIC_OPENAI_KEY);

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: contentParts }],
                    max_tokens: 1500,
                }),
            });

            console.log('[scanWithGPT] response status:', response.status);
            console.log('[scanWithGPT] response ok?', response.ok);

            const data = await response.json();
            console.log('[scanWithGPT] raw API response:', JSON.stringify(data, null, 2));

            if (!response.ok) {
                console.error('[scanWithGPT] API error:', data.error?.message);
                Alert.alert('API Error', data.error?.message ?? 'OpenAI request failed');
                setStep('pick');
                return;
            }

            const rawText = data.choices?.[0]?.message?.content ?? '[]';
            console.log('[scanWithGPT] raw GPT text response:', rawText);

            const clean = rawText.replace(/```json|```/g, '').trim();
            console.log('[scanWithGPT] cleaned text:', clean);

            let parsed: any[] = [];
            try {
                parsed = JSON.parse(clean);
                console.log('[scanWithGPT] parsed JSON:', JSON.stringify(parsed, null, 2));
            } catch (parseErr) {
                console.error('[scanWithGPT] JSON parse error:', parseErr);
                Alert.alert('Parse Error', 'Could not read GPT response. Try again.');
                setStep('pick');
                return;
            }

            if (!Array.isArray(parsed) || parsed.length === 0) {
                console.warn('[scanWithGPT] no subscriptions found in response');
                Alert.alert(
                    'No Subscriptions Found',
                    "Sorry, you haven't spent any money on subscriptions in this statement. If you want, you can add them manually.",
                    [
                        {
                            text: 'Add Manually',
                            onPress: () => {
                                console.log('[scanWithGPT] user chose to add manually');
                                resetAndClose();
                            },
                        },
                        {
                            text: 'Try Another File',
                            onPress: () => {
                                console.log('[scanWithGPT] user chose to try another file');
                                setStep('pick');
                            },
                            style: 'cancel',
                        },
                    ]
                );
                return;
            }

            console.log(`[scanWithGPT] found ${parsed.length} subscriptions:`, parsed.map(s => s.name));
            setFound(parsed.map((item) => ({ ...item, selected: true })));
            setStep('preview');

        } catch (err) {
            console.error('[scanWithGPT] network/fetch error:', err);
            Alert.alert('Scan failed', 'Network error. Please check your connection and try again.');
            setStep('pick');
        }
    };

    const handlePickImage = async () => {
        console.log('[handlePickImage] opening image picker...');

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('[handlePickImage] permission status:', permissionResult.status);

        if (!permissionResult.granted) {
            console.warn('[handlePickImage] permission denied');
            Alert.alert('Permission required', 'Please allow access to your photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',// ✅ fixed deprecation warning
            base64: true,
            quality: 0.8,
        });

        console.log('[handlePickImage] picker result canceled?', result.canceled);

        if (result.canceled || !result.assets?.[0]) {
            console.log('[handlePickImage] user canceled picker');
            return;
        }

        const asset = result.assets[0];
        console.log('[handlePickImage] picked asset uri:', asset.uri);
        console.log('[handlePickImage] mimeType:', asset.mimeType);
        console.log('[handlePickImage] base64 length:', asset.base64?.length ?? 0);
        console.log('[handlePickImage] image dimensions:', asset.width, 'x', asset.height);

        if (!asset.base64) {
            console.error('[handlePickImage] base64 is empty');
            Alert.alert('Error', 'Could not read image data.');
            return;
        }

        await scanWithGPT(asset.base64, asset.mimeType ?? 'image/jpeg');
    };

    const handlePickPDF = async () => {
        console.log('[handlePickPDF] opening document picker...');

        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
            copyToCacheDirectory: true,
        });

        console.log('[handlePickPDF] picker result canceled?', result.canceled);

        if (result.canceled || !result.assets?.[0]) {
            console.log('[handlePickPDF] user canceled picker');
            return;
        }

        const asset = result.assets[0];
        console.log('[handlePickPDF] picked file name:', asset.name);
        console.log('[handlePickPDF] picked file uri:', asset.uri);
        console.log('[handlePickPDF] file size (bytes):', asset.size);

        try {
            console.log('[handlePickPDF] reading file as base64...');
            const base64 = await FileSystem.readAsStringAsync(asset.uri, {
                encoding: 'base64',
            });
            console.log('[handlePickPDF] base64 length:', base64.length);
            await scanWithGPT(base64, 'application/pdf');
        } catch (err) {
            console.error('[handlePickPDF] file read error:', err);
            Alert.alert('Error', 'Could not read the PDF file.');
        }
    };

    const toggleItem = (index: number) => {
        console.log(`[toggleItem] toggling item at index ${index}:`, found[index]?.name);
        setFound((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, selected: !item.selected } : item
            )
        );
    };

    const handleAddSelected = () => {
        const selected = found.filter((s) => s.selected);
        console.log(`[handleAddSelected] adding ${selected.length} subscriptions`);
        selected.forEach((s) => console.log(' -', s.name, s.price, s.currency));

        const now = dayjs();

        selected.forEach((s) => {
            const renewalDate =
                s.billing === 'Monthly' ? now.add(1, 'month') : now.add(1, 'year');

            const newSub: Subscription = {
                id: `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                name: s.name,
                price: s.price,
                currency: s.currency || currencyCode,
                billing: s.billing,
                category: s.category,
                color: CATEGORY_COLORS[s.category] ?? '#d4d4d4',
                status: 'active',
                startDate: now.toISOString(),
                renewalDate: renewalDate.toISOString(),
                // ✅ no icon
            };

            console.log('[handleAddSelected] adding to store:', JSON.stringify(newSub, null, 2));
            addSubscription(newSub);
        });

        console.log('[handleAddSelected] all subscriptions added, closing modal');
        resetAndClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
            <Pressable style={styles.overlay} onPress={resetAndClose}>
                <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>

                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {step === 'pick' && 'Scan Bank Statement'}
                            {step === 'scanning' && 'Scanning...'}
                            {step === 'preview' && `Found ${found.length} Subscription${found.length !== 1 ? 's' : ''}`}
                        </Text>
                        {step !== 'scanning' && (
                            <Pressable style={styles.closeBtn} onPress={resetAndClose}>
                                <Text style={styles.closeText}>✕</Text>
                            </Pressable>
                        )}
                    </View>

                    {step === 'pick' && (
                        <View style={styles.pickWrap}>
                            <Text style={styles.pickSubtitle}>
                                Upload a bank statement or screenshot — AI will detect your subscriptions automatically.
                            </Text>

                            <Pressable style={styles.pickOption} onPress={handlePickImage}>
                                <Text style={styles.pickOptionIcon}>🖼️</Text>
                                <View>
                                    <Text style={styles.pickOptionTitle}>Upload Screenshot</Text>
                                    <Text style={styles.pickOptionSub}>JPG, PNG from your photos</Text>
                                </View>
                            </Pressable>

                            <Pressable style={styles.pickOption} onPress={handlePickPDF}>
                                <Text style={styles.pickOptionIcon}>📄</Text>
                                <View>
                                    <Text style={styles.pickOptionTitle}>Upload PDF</Text>
                                    <Text style={styles.pickOptionSub}>Bank statement in PDF format</Text>
                                </View>
                            </Pressable>
                        </View>
                    )}

                    {step === 'scanning' && (
                        <View style={styles.scanningWrap}>
                            <ActivityIndicator size="large" color={colors.accent} />
                            <Text style={styles.scanningText}>AI is reading your statement...</Text>
                            <Text style={styles.scanningSubText}>This may take a few seconds</Text>
                        </View>
                    )}

                    {step === 'preview' && (
                        <>
                            <Text style={styles.previewHint}>
                                Tap any item to deselect it before adding.
                            </Text>

                            <ScrollView
                                style={styles.previewList}
                                contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
                                {found.map((item, index) => (
                                    <Pressable
                                        key={index}
                                        style={[
                                            styles.previewItem,
                                            !item.selected && styles.previewItemUnselected,
                                        ]}
                                        onPress={() => toggleItem(index)}>
                                        <View style={styles.previewLeft}>
                                            <View style={[
                                                styles.checkbox,
                                                item.selected && styles.checkboxSelected,
                                            ]}>
                                                {item.selected && <Text style={styles.checkmark}>✓</Text>}
                                            </View>
                                            <View>
                                                <Text style={styles.previewName}>{item.name}</Text>
                                                <Text style={styles.previewMeta}>
                                                    {item.category} · {item.billing}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.previewPrice}>
                                            {item.currency} {item.price.toFixed(2)}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>

                            <Pressable
                                style={[
                                    styles.addButton,
                                    found.filter((s) => s.selected).length === 0 && styles.addButtonDisabled,
                                ]}
                                onPress={handleAddSelected}
                                disabled={found.filter((s) => s.selected).length === 0}>
                                <Text style={styles.addButtonText}>
                                    Add {found.filter((s) => s.selected).length} Subscription
                                    {found.filter((s) => s.selected).length !== 1 ? 's' : ''}
                                </Text>
                            </Pressable>

                            <Pressable
                                style={styles.rescanBtn}
                                onPress={() => {
                                    console.log('[preview] user chose to scan another file');
                                    setStep('pick');
                                    setFound([]);
                                }}>
                                <Text style={styles.rescanText}>← Scan another file</Text>
                            </Pressable>
                        </>
                    )}

                </Pressable>
            </Pressable>
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
        paddingBottom: 32,
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
    title: { fontSize: 18, fontFamily: 'sans-bold', color: colors.primary },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: colors.muted,
        alignItems: 'center', justifyContent: 'center',
    },
    closeText: { fontSize: 14, fontFamily: 'sans-bold', color: colors.primary },
    pickWrap: { padding: 20, gap: 16 },
    pickSubtitle: {
        fontSize: 14, fontFamily: 'sans-medium',
        color: colors.mutedForeground, lineHeight: 20,
    },
    pickOption: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        backgroundColor: colors.card, borderRadius: 16,
        padding: 16, borderWidth: 1, borderColor: colors.border,
    },
    pickOptionIcon: { fontSize: 32 },
    pickOptionTitle: { fontSize: 15, fontFamily: 'sans-semibold', color: colors.primary },
    pickOptionSub: {
        fontSize: 13, fontFamily: 'sans-regular',
        color: colors.mutedForeground, marginTop: 2,
    },
    scanningWrap: {
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 60, gap: 16,
    },
    scanningText: { fontSize: 16, fontFamily: 'sans-semibold', color: colors.primary },
    scanningSubText: { fontSize: 13, fontFamily: 'sans-regular', color: colors.mutedForeground },
    previewHint: {
        fontSize: 13, fontFamily: 'sans-medium',
        color: colors.mutedForeground,
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
    },
    previewList: { paddingHorizontal: 20, maxHeight: 360 },
    previewItem: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card, borderRadius: 14,
        padding: 14, borderWidth: 1.5, borderColor: colors.accent,
    },
    previewItemUnselected: { borderColor: colors.border, opacity: 0.5 },
    previewLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkbox: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: colors.border,
        alignItems: 'center', justifyContent: 'center',
    },
    checkboxSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
    checkmark: { color: '#fff', fontSize: 13, fontFamily: 'sans-bold' },
    previewName: { fontSize: 15, fontFamily: 'sans-semibold', color: colors.primary },
    previewMeta: {
        fontSize: 12, fontFamily: 'sans-regular',
        color: colors.mutedForeground, marginTop: 2,
    },
    previewPrice: { fontSize: 15, fontFamily: 'sans-bold', color: colors.primary },
    addButton: {
        backgroundColor: colors.accent, borderRadius: 16,
        paddingVertical: 18, alignItems: 'center',
        marginHorizontal: 20, marginTop: 16,
    },
    addButtonDisabled: { opacity: 0.45 },
    addButtonText: { fontSize: 16, fontFamily: 'sans-bold', color: '#fff' },
    rescanBtn: { alignItems: 'center', marginTop: 12 },
    rescanText: { fontSize: 14, fontFamily: 'sans-medium', color: colors.mutedForeground },
});