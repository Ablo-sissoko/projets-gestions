import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const DashboardPrestations = () => {
    const pipeline = [
        { label: 'Devis envoyés', value: 18 },
        { label: 'Acceptés', value: 9 },
        { label: 'En attente', value: 6 },
    ]

    const topServices = [
        { name: 'Audit digital', marge: '42%' },
        { name: 'Maintenance IT', marge: '38%' },
        { name: 'Nettoyage premium', marge: '35%' },
    ]

    return (
        <View style={styles.screen}>
            <Header />
            <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Dashboard Prestations</Text>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Pipeline de ventes</Text>
                <View style={styles.metricGrid}>
                    {pipeline.map((item) => (
                        <View key={item.label} style={styles.metricCard}>
                            <Text style={styles.metricLabel}>{item.label}</Text>
                            <Text style={styles.metricValue}>{item.value}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Performance commerciale</Text>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>Taux de transformation</Text>
                    <Text style={styles.rowValue}>57%</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>CA prévisionnel</Text>
                    <Text style={styles.rowValue}>12 400 000 FCFA</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Top 3 services</Text>
                {topServices.map((item) => (
                    <View key={item.name} style={styles.row}>
                        <Text style={styles.rowLabel}>{item.name}</Text>
                        <Text style={styles.rowTag}>{item.marge}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
        </View>
    )
}

export default DashboardPrestations

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    scroll: {
        flex: 1,
    },
    container: {
        padding: 16,
        paddingBottom: 32,
        backgroundColor: COLORS.bg,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },
    metricGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    metricCard: {
        flex: 1,
        backgroundColor: COLORS.bg,
        borderRadius: 12,
        padding: 12,
    },
    metricLabel: {
        color: COLORS.muted,
        fontSize: 12,
    },
    metricValue: {
        color: COLORS.text,
        fontWeight: '700',
        fontSize: 16,
        marginTop: 6,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    rowLabel: {
        color: COLORS.text,
        fontWeight: '600',
    },
    rowValue: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    rowTag: {
        color: COLORS.text,
        fontWeight: '700',
        fontSize: 12,
    },
})