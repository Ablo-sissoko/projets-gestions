import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    CalendarDays,
    Scissors,
    Users,
    TrendingUp,
    Clock,
    Sparkles,
    ChevronRight,
    AlertCircle,
    CalendarClock,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../componants/Header';
import COLORS from '../../constants/couleurs';

/** Accent salon — aligné sur Rendez-vous & agenda */
const SALON_ACCENT = '#E67E22';
const SALON_ACCENT_SOFT = '#FDF6EE';
const SALON_INK = '#1A2C3E';
const SALON_MUTED = '#64748B';

const MOCK_TODAY_HIGHLIGHTS = [
    { id: '1', time: '09:00', client: 'Mme Lambert', service: 'Coupe & brushing', staff: 'Sophie M.' },
    { id: '2', time: '11:30', client: 'Thomas D.', service: 'Coupe homme', staff: 'Marc L.' },
    { id: '3', time: '14:00', client: 'Camille R.', service: 'Coloration', staff: 'Julie P.' },
];

const MOCK_ALERTS = [
    { id: 'a1', text: 'Crème décolorante — stock bas (2 unités)', tone: 'warning' },
    { id: 'a2', text: 'Marc L. — pause déjeuner 12h30–13h30', tone: 'info' },
];

const DashboardSalon = () => {
    const navigation = useNavigation();

    const stats = useMemo(
        () => [
            {
                key: 'rdv',
                label: "Aujourd'hui",
                value: '12',
                unit: 'RDV',
                delta: '+2 vs hier',
                Icon: CalendarDays,
            },
            {
                key: 'ca',
                label: 'CA estimé',
                value: '428',
                unit: 'k FCFA',
                delta: '+6 % sem.',
                Icon: TrendingUp,
            },
            {
                key: 'taux',
                label: 'Taux remplissage',
                value: '78',
                unit: '%',
                delta: 'Créneaux jour',
                Icon: Clock,
            },
            {
                key: 'team',
                label: 'Équipe',
                value: '4',
                unit: 'actifs',
                delta: 'Sur place',
                Icon: Users,
            },
        ],
        []
    );

    const quickLinks = useMemo(
        () => [
            {
                route: 'RendezVous',
                title: 'Agenda',
                subtitle: 'Planning & rendez-vous',
                Icon: CalendarClock,
            },
            {
                route: 'CoiffeursEtServices',
                title: 'Services',
                subtitle: 'Tarifs & catalogues',
                Icon: Scissors,
            },
        ],
        []
    );

    const go = (routeName) => {
        try {
            navigation.navigate(routeName);
        } catch {
            /* route peut être masquée par permissions */
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
            <View style={styles.screen}>
                <Header />
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                  

                    <View style={styles.statsGrid}>
                        {stats.map((s) => {
                            const StatIcon = s.Icon;
                            return (
                                <View key={s.key} style={styles.statCard}>
                                    <View style={styles.statIconBox}>
                                        <StatIcon size={18} color={COLORS.text} strokeWidth={2} />
                                    </View>
                                    <Text style={styles.statValueText}>
                                        {s.value}
                                        {s.unit ? ` ${s.unit}` : ''}
                                    </Text>
                                    <Text style={styles.statLabelText}>{s.label}</Text>
                                    {s.delta ? <Text style={styles.statHint}>{s.delta}</Text> : null}
                                </View>
                            );
                        })}
                    </View>
                    <Text style={styles.sectionTitle}>À venir aujourd’hui</Text>
                    <View style={styles.card}>
                        {MOCK_TODAY_HIGHLIGHTS.map((row, i) => (
                            <View
                                key={row.id}
                                style={[styles.timelineRow, i < MOCK_TODAY_HIGHLIGHTS.length - 1 && styles.timelineRowBorder]}
                            >
                                <View style={styles.timePill}>
                                    <Text style={styles.timePillText}>{row.time}</Text>
                                </View>
                                <View style={styles.timelineBody}>
                                    <Text style={styles.timelineClient}>{row.client}</Text>
                                    <Text style={styles.timelineService}>{row.service}</Text>
                                    <Text style={styles.timelineStaff}>{row.staff}</Text>
                                </View>
                            </View>
                        ))}
                        <TouchableOpacity style={styles.seeAllBtn} onPress={() => go('RendezVous')} activeOpacity={0.8}>
                            <Text style={styles.seeAllText}>Ouvrir l’agenda complet</Text>
                            <ChevronRight size={18} color={SALON_ACCENT} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>Accès rapide</Text>
                    <View style={styles.quickList}>
                        {quickLinks.map((item, index) => (
                            <TouchableOpacity
                                key={item.route}
                                style={[
                                    styles.quickRow,
                                    index === quickLinks.length - 1 && styles.quickRowLast,
                                ]}
                                onPress={() => go(item.route)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.quickIcon}>
                                    <item.Icon size={22} color={SALON_ACCENT} strokeWidth={2} />
                                </View>
                                <View style={styles.quickTexts}>
                                    <Text style={styles.quickTitle}>{item.title}</Text>
                                    <Text style={styles.quickSubtitle}>{item.subtitle}</Text>
                                </View>
                                <ChevronRight size={20} color={SALON_MUTED} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    

                    <Text style={styles.sectionTitle}>À surveiller</Text>
                    <View style={styles.card}>
                        {MOCK_ALERTS.map((a, idx) => (
                            <View
                                key={a.id}
                                style={[styles.alertRow, idx === MOCK_ALERTS.length - 1 && styles.alertRowLast]}
                            >
                                <AlertCircle
                                    size={18}
                                    color={a.tone === 'warning' ? COLORS.warning : COLORS.muted}
                                />
                                <Text style={styles.alertText}>{a.text}</Text>
                            </View>
                        ))}
                    </View>

                    
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default DashboardSalon;

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    screen: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 28,
    },
    hero: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.card,
        borderRadius: CARD_RADIUS,
        padding: 18,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    heroTextWrap: {
        flex: 1,
        paddingRight: 12,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        backgroundColor: SALON_ACCENT_SOFT,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 10,
    },
    heroBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: SALON_ACCENT,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: SALON_INK,
        letterSpacing: -0.3,
    },
    heroSubtitle: {
        marginTop: 6,
        fontSize: 14,
        lineHeight: 20,
        color: SALON_MUTED,
    },
    heroIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: SALON_ACCENT_SOFT,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(230, 126, 34, 0.2)',
    },
    /** Aligné sur `Dashboard.js` — cartes 48 %, icône sur pastille primary */
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginVertical: 15,
    },
    statCard: {
        width: '48%',
        backgroundColor: COLORS.card,
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        elevation: 1,
    },
    statIconBox: {
        backgroundColor: COLORS.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValueText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    statLabelText: {
        fontSize: 12,
        color: COLORS.muted,
        marginTop: 2,
    },
    statHint: {
        fontSize: 11,
        color: COLORS.muted,
        marginTop: 4,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: SALON_INK,
        marginBottom: 12,
        letterSpacing: -0.2,
    },
    quickList: {
        backgroundColor: COLORS.card,
        borderRadius: CARD_RADIUS,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        marginBottom: 22,
    },
    quickRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    quickRowLast: {
        borderBottomWidth: 0,
    },
    quickIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: SALON_ACCENT_SOFT,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    quickTexts: {
        flex: 1,
    },
    quickTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: SALON_INK,
    },
    quickSubtitle: {
        marginTop: 2,
        fontSize: 13,
        color: SALON_MUTED,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: CARD_RADIUS,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 22,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    timelineRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    timelineRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    timePill: {
        backgroundColor: SALON_ACCENT_SOFT,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        marginRight: 12,
        minWidth: 56,
        alignItems: 'center',
    },
    timePillText: {
        fontSize: 13,
        fontWeight: '700',
        color: SALON_ACCENT,
    },
    timelineBody: {
        flex: 1,
    },
    timelineClient: {
        fontSize: 15,
        fontWeight: '600',
        color: SALON_INK,
    },
    timelineService: {
        marginTop: 2,
        fontSize: 13,
        color: SALON_MUTED,
    },
    timelineStaff: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: '500',
        color: '#94A3B8',
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 8,
        paddingVertical: 12,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: SALON_ACCENT,
    },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    alertRowLast: {
        borderBottomWidth: 0,
        paddingBottom: 4,
    },
    alertText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        color: SALON_INK,
    },
    footerHint: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    footerHintText: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 18,
    },
});

