// screens/DailyAgendaAbsencesScreen.js
import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    FlatList,
    Alert,
    Dimensions,
    Platform,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    Filter,
    User,
    Scissors,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Edit2,
    Trash2,
    UserCheck,
    Check,
    Phone,
    Mail,
    Users,
    Briefcase,
    X,
    Save,
} from 'lucide-react-native';
import Header from '../../componants/Header';
import COLORS from '../../constants/couleurs';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Types de statuts
const statuses = {
    arrived: { label: 'Arrivé', color: '#27AE60', icon: 'UserCheck' },
    inProgress: { label: 'En cours', color: '#3498DB', icon: 'Scissors' },
    completed: { label: 'Terminé', color: '#9B59B6', icon: 'CheckCircle' },
    absent: { label: 'Absent', color: '#E74C3C', icon: 'XCircle' },
    waiting: { label: 'En attente', color: '#F39C12', icon: 'Clock' },
};

// Types de congés
const leaveTypes = {
    vacation: { label: 'Congés payés', color: '#3498DB' },
    sick: { label: 'Arrêt maladie', color: '#E74C3C' },
    personal: { label: 'Congé personnel', color: '#F39C12' },
    training: { label: 'Formation', color: '#9B59B6' },
    other: { label: 'Autre', color: '#95A5A6' },
};

// Données simulées - Coiffeurs
const hairdressers = [
    { id: '1', name: 'Sophie Martin', color: '#E67E22', phone: '06 12 34 56 78' },
    { id: '2', name: 'Marc Laurent', color: '#9B59B6', phone: '06 23 45 67 89' },
    { id: '3', name: 'Julie Petit', color: '#3498DB', phone: '06 34 56 78 90' },
    { id: '4', name: 'Alexandre Roy', color: '#1ABC9C', phone: '06 45 67 89 01' },
];

const services = [
    { id: '1', name: 'Coupe Homme', duration: 30, price: 35 },
    { id: '2', name: 'Coupe Femme', duration: 45, price: 45 },
    { id: '3', name: 'Coloration', duration: 90, price: 80 },
    { id: '4', name: 'Brushing', duration: 30, price: 25 },
    { id: '5', name: 'Barbe', duration: 20, price: 20 },
];

// Données simulées - Rendez-vous du jour
const mockAppointments = [
    {
        id: '1',
        clientName: 'Sophie Lambert',
        clientPhone: '06 12 34 56 78',
        clientEmail: 'sophie@email.com',
        service: 'Coupe Femme',
        serviceDuration: 45,
        servicePrice: 45,
        time: '09:00',
        hairdresserId: '1',
        hairdresserName: 'Sophie Martin',
        hairdresserColor: '#E67E22',
        status: 'arrived',
        notes: 'Préfère une coupe dégradée',
    },
    {
        id: '2',
        clientName: 'Thomas Dubois',
        clientPhone: '06 23 45 67 89',
        clientEmail: 'thomas@email.com',
        service: 'Coupe Homme',
        serviceDuration: 30,
        servicePrice: 35,
        time: '10:00',
        hairdresserId: '2',
        hairdresserName: 'Marc Laurent',
        hairdresserColor: '#9B59B6',
        status: 'inProgress',
        notes: '',
    },
    {
        id: '3',
        clientName: 'Julie Martin',
        clientPhone: '06 34 56 78 90',
        clientEmail: 'julie@email.com',
        service: 'Coloration',
        serviceDuration: 90,
        servicePrice: 80,
        time: '11:00',
        hairdresserId: '3',
        hairdresserName: 'Julie Petit',
        hairdresserColor: '#3498DB',
        status: 'waiting',
        notes: 'Allergie aux produits chimiques',
    },
    {
        id: '4',
        clientName: 'Nicolas Petit',
        clientPhone: '06 45 67 89 01',
        clientEmail: 'nicolas@email.com',
        service: 'Barbe',
        serviceDuration: 20,
        servicePrice: 20,
        time: '14:00',
        hairdresserId: '2',
        hairdresserName: 'Marc Laurent',
        hairdresserColor: '#9B59B6',
        status: 'waiting',
        notes: '',
    },
];

// Données simulées - Clients en attente (walk-in)
const mockWalkInClients = [
    {
        id: 'w1',
        clientName: 'Jean Dupont',
        clientPhone: '06 78 90 12 34',
        service: 'Coupe Homme',
        arrivalTime: '14:30',
        waitTime: 15,
    },
    {
        id: 'w2',
        clientName: 'Marie Curie',
        clientPhone: '06 89 01 23 45',
        service: 'Brushing',
        arrivalTime: '14:45',
        waitTime: 0,
    },
];

// Données simulées - Congés
const mockLeaves = [
    {
        id: '1',
        hairdresserId: '3',
        hairdresserName: 'Julie Petit',
        type: 'vacation',
        startDate: '2026-04-10',
        endDate: '2026-04-20',
        reason: 'Vacances d\'été',
        status: 'approved',
        approvedBy: 'Admin',
        approvedAt: '2026-03-15',
        createdAt: '2026-03-10',
    },
    {
        id: '2',
        hairdresserId: '2',
        hairdresserName: 'Marc Laurent',
        type: 'sick',
        startDate: '2026-04-05',
        endDate: '2026-04-07',
        reason: 'Grippe',
        status: 'pending',
        createdAt: '2026-04-01',
    },
];

const isSameDay = (d1, d2) => {
    const a = new Date(d1);
    const b = new Date(d2);
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
};

const parseTime = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

const DailyAgendaAbsencesScreen = () => {
    const [activeTab, setActiveTab] = useState('agenda'); // 'agenda' or 'leaves'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedHairdresser, setSelectedHairdresser] = useState('all');
    const [appointments, setAppointments] = useState(mockAppointments);
    const [walkInClients, setWalkInClients] = useState(mockWalkInClients);
    const [leaves, setLeaves] = useState(mockLeaves);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showWalkInModal, setShowWalkInModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [editingLeave, setEditingLeave] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Formulaire walk-in
    const [walkInForm, setWalkInForm] = useState({
        clientName: '',
        clientPhone: '',
        service: '',
        notes: '',
    });

    // Formulaire congé
    const [leaveForm, setLeaveForm] = useState({
        hairdresserId: '',
        type: 'vacation',
        startDate: new Date(),
        endDate: new Date(),
        reason: '',
    });

    const bottomSheetRef = useRef(null);
    const sheetSnapPoints = useMemo(() => ['60%'], []);

    const renderSheetBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={0.35}
                pressBehavior="close"
            />
        ),
        []
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'arrived': return '#27AE60';
            case 'inProgress': return '#3498DB';
            case 'completed': return '#9B59B6';
            case 'absent': return '#E74C3C';
            case 'waiting': return '#F39C12';
            default: return '#95A5A6';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'arrived': return <UserCheck size={16} color="#27AE60" />;
            case 'inProgress': return <Scissors size={16} color="#3498DB" />;
            case 'completed': return <CheckCircle size={16} color="#9B59B6" />;
            case 'absent': return <XCircle size={16} color="#E74C3C" />;
            case 'waiting': return <Clock size={16} color="#F39C12" />;
            default: return <AlertCircle size={16} color="#95A5A6" />;
        }
    };

    const getStatusText = (status) => {
        const statusMap = {
            arrived: 'Arrivé',
            inProgress: 'En cours',
            completed: 'Terminé',
            absent: 'Absent',
            waiting: 'En attente',
        };
        return statusMap[status] || status;
    };

    const getLeaveTypeText = (type) => {
        return leaveTypes[type]?.label || type;
    };

    const getLeaveTypeColor = (type) => {
        return leaveTypes[type]?.color || '#95A5A6';
    };

    const handleUpdateStatus = (appointment, newStatus) => {
        setAppointments(prev =>
            prev.map(apt =>
                apt.id === appointment.id ? { ...apt, status: newStatus } : apt
            )
        );
        Alert.alert('Succès', `Rendez-vous marqué comme ${getStatusText(newStatus)}`);
        setShowDetailsModal(false);
    };

    const handleMarkArrived = (appointment) => {
        handleUpdateStatus(appointment, 'arrived');
    };

    const handleCallClient = (phoneNumber) => {
        Alert.alert('Appeler', `Appeler ${phoneNumber} ?`, [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Appeler', onPress: () => console.log('Appel vers', phoneNumber) },
        ]);
    };

    const handleAddWalkIn = () => {
        if (!walkInForm.clientName || !walkInForm.service) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
            return;
        }

        const newWalkIn = {
            id: `w${Date.now()}`,
            clientName: walkInForm.clientName,
            clientPhone: walkInForm.clientPhone,
            service: walkInForm.service,
            arrivalTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            waitTime: 0,
        };

        setWalkInClients(prev => [...prev, newWalkIn]);
        setShowWalkInModal(false);
        setWalkInForm({ clientName: '', clientPhone: '', service: '', notes: '' });
        Alert.alert('Succès', 'Client ajouté à la file d\'attente');
    };

    const handleAddLeave = () => {
        if (!leaveForm.hairdresserId) {
            Alert.alert('Erreur', 'Veuillez sélectionner un coiffeur');
            return;
        }

        const selectedHairdresserData = hairdressers.find(h => h.id === leaveForm.hairdresserId);
        const startDateStr = leaveForm.startDate.toISOString().split('T')[0];
        const endDateStr = leaveForm.endDate.toISOString().split('T')[0];

        const newLeave = {
            id: editingLeave?.id || Date.now().toString(),
            hairdresserId: leaveForm.hairdresserId,
            hairdresserName: selectedHairdresserData?.name || '',
            type: leaveForm.type,
            startDate: startDateStr,
            endDate: endDateStr,
            reason: leaveForm.reason,
            status: 'pending',
            createdAt: new Date().toISOString().split('T')[0],
        };

        if (editingLeave) {
            setLeaves(prev => prev.map(l => l.id === editingLeave.id ? newLeave : l));
            Alert.alert('Succès', 'Demande de congé modifiée');
        } else {
            setLeaves(prev => [...prev, newLeave]);
            Alert.alert('Succès', 'Demande de congé soumise');
        }

        setShowLeaveModal(false);
        setEditingLeave(null);
        setLeaveForm({
            hairdresserId: '',
            type: 'vacation',
            startDate: new Date(),
            endDate: new Date(),
            reason: '',
        });
    };

    const handleApproveLeave = (leave) => {
        setLeaves(prev =>
            prev.map(l =>
                l.id === leave.id
                    ? { ...l, status: 'approved', approvedBy: 'Admin', approvedAt: new Date().toISOString().split('T')[0] }
                    : l
            )
        );
        Alert.alert('Succès', 'Demande de congé approuvée');
    };

    const handleRejectLeave = (leave) => {
        Alert.alert(
            'Refuser la demande',
            `Voulez-vous vraiment refuser la demande de congé de ${leave.hairdresserName} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Refuser',
                    onPress: () => {
                        setLeaves(prev => prev.filter(l => l.id !== leave.id));
                        Alert.alert('Succès', 'Demande de congé refusée');
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const getAvailableTimeSlots = () => {
        const timeSlots = [];
        for (let hour = 9; hour <= 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const isBooked = appointments.some(apt => apt.time === time);
                if (!isBooked) {
                    timeSlots.push(time);
                }
            }
        }
        return timeSlots.slice(0, 8);
    };

    const filteredAppointments = useMemo(() => {
        return appointments.filter(apt => {
            const matchesSearch =
                searchQuery === '' ||
                apt.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                apt.hairdresserName.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesHairdresser =
                selectedHairdresser === 'all' || apt.hairdresserId === selectedHairdresser;

            return matchesSearch && matchesHairdresser;
        });
    }, [appointments, searchQuery, selectedHairdresser]);

    const groupedAppointments = useMemo(() => {
        const grouped = {};
        filteredAppointments.forEach(apt => {
            if (!grouped[apt.hairdresserId]) {
                grouped[apt.hairdresserId] = {
                    hairdresser: hairdressers.find(h => h.id === apt.hairdresserId),
                    appointments: [],
                };
            }
            grouped[apt.hairdresserId].appointments.push(apt);
        });
        return grouped;
    }, [filteredAppointments]);

    const pendingLeaves = leaves.filter(l => l.status === 'pending');
    const approvedLeaves = leaves.filter(l => l.status === 'approved');

    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1500);
    };

    const renderAppointmentCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.appointmentCard, { borderLeftColor: item.hairdresserColor }]}
            onPress={() => {
                setSelectedAppointment(item);
                setShowDetailsModal(true);
            }}
        >
            <View style={styles.appointmentTime}>
                <Text style={styles.appointmentTimeText}>{item.time}</Text>
                <Text style={styles.appointmentDuration}>{item.serviceDuration} min</Text>
            </View>

            <View style={styles.appointmentInfo}>
                <View style={styles.appointmentHeader}>
                    <Text style={styles.clientName}>{item.clientName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
                        {getStatusIcon(item.status)}
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {getStatusText(item.status)}
                        </Text>
                    </View>
                </View>

                <View style={styles.appointmentDetails}>
                    <View style={styles.detailItem}>
                        <Scissors size={14} color="#7F8C8D" />
                        <Text style={styles.detailText}>{item.service}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <User size={14} color="#7F8C8D" />
                        <Text style={styles.detailText}>{item.hairdresserName}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.appointmentActions}>
                {item.status === 'waiting' && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleUpdateStatus(item, 'arrived')}
                    >
                        <UserCheck size={18} color="#27AE60" />
                    </TouchableOpacity>
                )}
                {item.status === 'arrived' && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleUpdateStatus(item, 'inProgress')}
                    >
                        <Scissors size={18} color="#3498DB" />
                    </TouchableOpacity>
                )}
                {item.status === 'inProgress' && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleUpdateStatus(item, 'completed')}
                    >
                        <Check size={18} color="#9B59B6" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCallClient(item.clientPhone)}
                >
                    <Phone size={18} color="#3498DB" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderAgendaTab = () => (
        <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Filtre coiffeur */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[styles.filterChip, selectedHairdresser === 'all' && styles.filterChipActive]}
                        onPress={() => setSelectedHairdresser('all')}
                    >
                        <Users size={16} color={selectedHairdresser === 'all' ? '#FFFFFF' : '#7F8C8D'} />
                        <Text style={[styles.filterChipText, selectedHairdresser === 'all' && styles.filterChipTextActive]}>
                            Tous
                        </Text>
                    </TouchableOpacity>
                    {hairdressers.map(h => (
                        <TouchableOpacity
                            key={h.id}
                            style={[styles.filterChip, selectedHairdresser === h.id && styles.filterChipActive]}
                            onPress={() => setSelectedHairdresser(h.id)}
                        >
                            <View style={[styles.filterDot, { backgroundColor: h.color }]} />
                            <Text style={[styles.filterChipText, selectedHairdresser === h.id && styles.filterChipTextActive]}>
                                {h.name.split(' ')[0]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Liste des rendez-vous par coiffeur */}
            {Object.values(groupedAppointments).map((group) => (
                <View key={group.hairdresser.id} style={styles.hairdresserSection}>
                    <View style={[styles.hairdresserHeader, { backgroundColor: `${group.hairdresser.color}10` }]}>
                        <View style={styles.hairdresserInfo}>
                            <View style={[styles.hairdresserBadge, { backgroundColor: group.hairdresser.color }]}>
                                <Text style={styles.hairdresserInitial}>
                                    {group.hairdresser.name.charAt(0)}
                                </Text>
                            </View>
                            <Text style={styles.hairdresserName}>{group.hairdresser.name}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.callButton}
                            onPress={() => handleCallClient(group.hairdresser.phone)}
                        >
                            <Phone size={16} color={group.hairdresser.color} />
                            <Text style={[styles.callButtonText, { color: group.hairdresser.color }]}>Appeler</Text>
                        </TouchableOpacity>
                    </View>

                    {group.appointments.length === 0 ? (
                        <View style={styles.emptyAppointments}>
                            <Text style={styles.emptyText}>Aucun rendez-vous</Text>
                        </View>
                    ) : (
                        group.appointments
                            .sort((a, b) => parseTime(a.time) - parseTime(b.time))
                            .map((apt) => (
                                <TouchableOpacity
                                    key={apt.id}
                                    style={[styles.appointmentCard, { borderLeftColor: apt.hairdresserColor }]}
                                    onPress={() => {
                                        setSelectedAppointment(apt);
                                        setShowDetailsModal(true);
                                    }}
                                >
                                    <View style={styles.appointmentTime}>
                                        <Text style={styles.appointmentTimeText}>{apt.time}</Text>
                                        <Text style={styles.appointmentDuration}>{apt.serviceDuration} min</Text>
                                    </View>

                                    <View style={styles.appointmentInfo}>
                                        <Text style={styles.clientName}>{apt.clientName}</Text>
                                        <Text style={styles.serviceName}>{apt.service}</Text>
                                        <View style={styles.appointmentStatus}>
                                            {getStatusIcon(apt.status)}
                                            <Text style={[styles.statusText, { color: getStatusColor(apt.status) }]}>
                                                {getStatusText(apt.status)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.appointmentActions}>
                                        <TouchableOpacity
                                            style={styles.actionIcon}
                                            onPress={() => handleCallClient(apt.clientPhone)}
                                        >
                                            <Phone size={18} color="#3498DB" />
                                        </TouchableOpacity>
                                        {apt.status === 'waiting' && (
                                            <TouchableOpacity
                                                style={styles.actionIcon}
                                                onPress={() => handleUpdateStatus(apt, 'arrived')}
                                            >
                                                <UserCheck size={18} color="#27AE60" />
                                            </TouchableOpacity>
                                        )}
                                        {apt.status === 'arrived' && (
                                            <TouchableOpacity
                                                style={styles.actionIcon}
                                                onPress={() => handleUpdateStatus(apt, 'inProgress')}
                                            >
                                                <Scissors size={18} color="#3498DB" />
                                            </TouchableOpacity>
                                        )}
                                        {apt.status === 'inProgress' && (
                                            <TouchableOpacity
                                                style={styles.actionIcon}
                                                onPress={() => handleUpdateStatus(apt, 'completed')}
                                            >
                                                <CheckCircle size={18} color="#9B59B6" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))
                    )}
                </View>
            ))}

            {/* Clients en attente (walk-in) */}
            <View style={styles.walkInSection}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleContainer}>
                        <Users size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Clients en attente</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => setShowWalkInModal(true)}>
                        <Plus size={20} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>Ajouter</Text>
                    </TouchableOpacity>
                </View>

                {walkInClients.length === 0 ? (
                    <View style={styles.emptyWalkIn}>
                        <Text style={styles.emptyText}>Aucun client en attente</Text>
                    </View>
                ) : (
                    walkInClients.map((client) => (
                        <View key={client.id} style={styles.walkInCard}>
                            <View style={styles.walkInInfo}>
                                <Text style={styles.walkInName}>{client.clientName}</Text>
                                <Text style={styles.walkInService}>{client.service}</Text>
                                <View style={styles.walkInMeta}>
                                    <Clock size={12} color="#7F8C8D" />
                                    <Text style={styles.walkInTime}>Arrivé à {client.arrivalTime}</Text>
                                    {client.waitTime > 0 && (
                                        <Text style={styles.walkInWait}>Attente: {client.waitTime} min</Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.walkInActions}>
                                <TouchableOpacity
                                    style={styles.walkInActionButton}
                                    onPress={() => handleCallClient(client.clientPhone)}
                                >
                                    <Phone size={18} color="#3498DB" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.walkInActionButton, styles.walkInAcceptButton]}
                                    onPress={() => {
                                        Alert.alert('Assigner', `Assigner ${client.clientName} à un coiffeur ?`);
                                    }}
                                >
                                    <UserCheck size={18} color="#27AE60" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Cases horaires disponibles */}
            <View style={styles.availableSlotsSection}>
                <Text style={styles.sectionTitle}>Créneaux disponibles</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.slotsContainer}>
                        {getAvailableTimeSlots().map((slot) => (
                            <View key={slot} style={styles.slotCard}>
                                <Clock size={16} color={COLORS.primary} />
                                <Text style={styles.slotTime}>{slot}</Text>
                                <Text style={styles.slotStatus}>Libre</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </ScrollView>
    );

    const renderLeavesTab = () => (
        <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Bouton ajouter congé */}
            <TouchableOpacity style={styles.addLeaveButton} onPress={() => setShowLeaveModal(true)}>
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addLeaveButtonText}>Demander un congé</Text>
            </TouchableOpacity>

            {/* Demandes en attente */}
            {pendingLeaves.length > 0 && (
                <View style={styles.leavesSection}>
                    <Text style={styles.sectionTitle}>Demandes en attente</Text>
                    {pendingLeaves.map((leave) => (
                        <View key={leave.id} style={styles.leaveCard}>
                            <View style={[styles.leaveHeader, { borderLeftColor: getLeaveTypeColor(leave.type) }]}>
                                <View>
                                    <Text style={styles.leaveHairdresser}>{leave.hairdresserName}</Text>
                                    <Text style={styles.leaveType}>{getLeaveTypeText(leave.type)}</Text>
                                </View>
                                <View style={[styles.leaveStatusBadge, { backgroundColor: '#F39C1215' }]}>
                                    <Clock size={12} color="#F39C12" />
                                    <Text style={[styles.leaveStatusText, { color: '#F39C12' }]}>En attente</Text>
                                </View>
                            </View>

                            <View style={styles.leaveDetails}>
                                <View style={styles.leaveDateRange}>
                                    <Calendar size={14} color="#7F8C8D" />
                                    <Text style={styles.leaveDateText}>
                                        {new Date(leave.startDate).toLocaleDateString('fr-FR')} - {new Date(leave.endDate).toLocaleDateString('fr-FR')}
                                    </Text>
                                </View>
                                {leave.reason && (
                                    <Text style={styles.leaveReason}>{leave.reason}</Text>
                                )}
                            </View>

                            <View style={styles.leaveActions}>
                                <TouchableOpacity
                                    style={[styles.leaveActionButton, styles.approveButton]}
                                    onPress={() => handleApproveLeave(leave)}
                                >
                                    <Check size={16} color="#FFFFFF" />
                                    <Text style={styles.leaveActionText}>Approuver</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.leaveActionButton, styles.rejectButton]}
                                    onPress={() => handleRejectLeave(leave)}
                                >
                                    <X size={16} color="#FFFFFF" />
                                    <Text style={styles.leaveActionText}>Refuser</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* Historique des congés */}
            <View style={styles.leavesSection}>
                <Text style={styles.sectionTitle}>Historique des congés</Text>
                {approvedLeaves.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Aucun historique</Text>
                    </View>
                ) : (
                    approvedLeaves.map((leave) => (
                        <View key={leave.id} style={styles.historyCard}>
                            <View style={styles.historyHeader}>
                                <Text style={styles.historyHairdresser}>{leave.hairdresserName}</Text>
                                <View style={[styles.historyStatusBadge, { backgroundColor: `${getLeaveTypeColor(leave.type)}15` }]}>
                                    <Text style={[styles.historyStatusText, { color: getLeaveTypeColor(leave.type) }]}>
                                        {getLeaveTypeText(leave.type)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.leaveDateRange}>
                                <Calendar size={12} color="#7F8C8D" />
                                <Text style={styles.historyDate}>
                                    {new Date(leave.startDate).toLocaleDateString('fr-FR')} - {new Date(leave.endDate).toLocaleDateString('fr-FR')}
                                </Text>
                            </View>

                            <View style={styles.historyFooter}>
                                <Text style={styles.approvedBy}>Approuvé par {leave.approvedBy}</Text>
                                <Text style={styles.approvedDate}>
                                    le {new Date(leave.approvedAt).toLocaleDateString('fr-FR')}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Calendrier des absences */}
            <View style={styles.calendarSection}>
                <Text style={styles.sectionTitle}>Calendrier des absences</Text>
                <View style={styles.calendarPlaceholder}>
                    <Calendar size={48} color="#BDC3C7" />
                    <Text style={styles.calendarPlaceholderText}>
                        Calendrier interactif des absences
                    </Text>
                    <Text style={styles.calendarSubtext}>
                        Les créneaux sont automatiquement bloqués dans l'agenda
                    </Text>
                </View>
            </View>
        </ScrollView>
    );

    // Modal Détails rendez-vous
    const renderDetailsModal = () => (
        <Modal
            visible={showDetailsModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDetailsModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {selectedAppointment && (
                        <>
                            <View style={[styles.detailsHeader, { backgroundColor: `${selectedAppointment.hairdresserColor}15` }]}>
                                <View>
                                    <Text style={styles.detailsClientName}>{selectedAppointment.clientName}</Text>
                                    <View style={styles.detailsStatus}>
                                        {getStatusIcon(selectedAppointment.status)}
                                        <Text style={[styles.detailsStatusText, { color: getStatusColor(selectedAppointment.status) }]}>
                                            {getStatusText(selectedAppointment.status)}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                                    <XCircle size={24} color="#7F8C8D" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.detailsSection}>
                                    <Text style={styles.detailsSectionTitle}>Informations</Text>
                                    <View style={styles.detailsInfoRow}>
                                        <Clock size={18} color="#7F8C8D" />
                                        <Text style={styles.detailsInfoText}>{selectedAppointment.time}</Text>
                                    </View>
                                    <View style={styles.detailsInfoRow}>
                                        <Scissors size={18} color="#7F8C8D" />
                                        <Text style={styles.detailsInfoText}>
                                            {selectedAppointment.service} ({selectedAppointment.serviceDuration} min)
                                        </Text>
                                    </View>
                                    <View style={styles.detailsInfoRow}>
                                        <User size={18} color="#7F8C8D" />
                                        <Text style={styles.detailsInfoText}>{selectedAppointment.hairdresserName}</Text>
                                    </View>
                                    <View style={styles.detailsInfoRow}>
                                        <Phone size={18} color="#7F8C8D" />
                                        <Text style={styles.detailsInfoText}>{selectedAppointment.clientPhone}</Text>
                                    </View>
                                    <View style={styles.detailsInfoRow}>
                                        <Mail size={18} color="#7F8C8D" />
                                        <Text style={styles.detailsInfoText}>{selectedAppointment.clientEmail}</Text>
                                    </View>
                                </View>

                                {selectedAppointment.notes && (
                                    <View style={styles.detailsSection}>
                                        <Text style={styles.detailsSectionTitle}>Notes</Text>
                                        <Text style={styles.detailsNotes}>{selectedAppointment.notes}</Text>
                                    </View>
                                )}
                            </ScrollView>

                            <View style={styles.detailsFooter}>
                                {selectedAppointment.status === 'waiting' && (
                                    <TouchableOpacity
                                        style={[styles.detailsButton, styles.arrivedButton]}
                                        onPress={() => handleUpdateStatus(selectedAppointment, 'arrived')}
                                    >
                                        <UserCheck size={20} color="#FFFFFF" />
                                        <Text style={styles.detailsButtonText}>Marquer arrivé</Text>
                                    </TouchableOpacity>
                                )}
                                {selectedAppointment.status === 'arrived' && (
                                    <TouchableOpacity
                                        style={[styles.detailsButton, styles.inProgressButton]}
                                        onPress={() => handleUpdateStatus(selectedAppointment, 'inProgress')}
                                    >
                                        <Scissors size={20} color="#FFFFFF" />
                                        <Text style={styles.detailsButtonText}>Commencer</Text>
                                    </TouchableOpacity>
                                )}
                                {selectedAppointment.status === 'inProgress' && (
                                    <TouchableOpacity
                                        style={[styles.detailsButton, styles.completeButton]}
                                        onPress={() => handleUpdateStatus(selectedAppointment, 'completed')}
                                    >
                                        <CheckCircle size={20} color="#FFFFFF" />
                                        <Text style={styles.detailsButtonText}>Terminer</Text>
                                    </TouchableOpacity>
                                )}
                                {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'absent' && (
                                    <TouchableOpacity
                                        style={[styles.detailsButton, styles.absentButton]}
                                        onPress={() => handleUpdateStatus(selectedAppointment, 'absent')}
                                    >
                                        <XCircle size={20} color="#FFFFFF" />
                                        <Text style={styles.detailsButtonText}>Absent</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );

    // Modal Ajouter walk-in
    const renderWalkInModal = () => (
        <Modal
            visible={showWalkInModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowWalkInModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Ajouter un client sans rendez-vous</Text>
                        <TouchableOpacity onPress={() => setShowWalkInModal(false)}>
                            <X size={24} color="#7F8C8D" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalScroll}>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Nom du client *</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Nom et prénom"
                                value={walkInForm.clientName}
                                onChangeText={(text) => setWalkInForm(prev => ({ ...prev, clientName: text }))}
                                placeholderTextColor="#7F8C8D"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Téléphone</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="06 12 34 56 78"
                                keyboardType="phone-pad"
                                value={walkInForm.clientPhone}
                                onChangeText={(text) => setWalkInForm(prev => ({ ...prev, clientPhone: text }))}
                                placeholderTextColor="#7F8C8D"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Service *</Text>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={services}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.serviceChip,
                                            walkInForm.service === item.name && styles.serviceChipActive,
                                        ]}
                                        onPress={() => setWalkInForm(prev => ({ ...prev, service: item.name }))}
                                    >
                                        <Text style={[
                                            styles.serviceChipText,
                                            walkInForm.service === item.name && styles.serviceChipTextActive,
                                        ]}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Notes</Text>
                            <TextInput
                                style={[styles.formInput, styles.formTextArea]}
                                placeholder="Préférences, allergies, etc."
                                multiline
                                numberOfLines={3}
                                value={walkInForm.notes}
                                onChangeText={(text) => setWalkInForm(prev => ({ ...prev, notes: text }))}
                                placeholderTextColor="#7F8C8D"
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowWalkInModal(false)}>
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleAddWalkIn}>
                            <Save size={20} color="#FFFFFF" />
                            <Text style={styles.saveButtonText}>Ajouter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Modal Demande congé
    const renderLeaveModal = () => (
        <Modal
            visible={showLeaveModal}
            transparent
            animationType="slide"
            onRequestClose={() => {
                setShowLeaveModal(false);
                setEditingLeave(null);
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {editingLeave ? 'Modifier la demande' : 'Nouvelle demande de congé'}
                        </Text>
                        <TouchableOpacity onPress={() => {
                            setShowLeaveModal(false);
                            setEditingLeave(null);
                        }}>
                            <X size={24} color="#7F8C8D" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalScroll}>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Coiffeur *</Text>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={hairdressers}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.hairdresserChip,
                                            leaveForm.hairdresserId === item.id && styles.hairdresserChipActive,
                                        ]}
                                        onPress={() => setLeaveForm(prev => ({ ...prev, hairdresserId: item.id }))}
                                    >
                                        <View style={[styles.hairdresserDot, { backgroundColor: item.color }]} />
                                        <Text style={[
                                            styles.hairdresserChipText,
                                            leaveForm.hairdresserId === item.id && styles.hairdresserChipTextActive,
                                        ]}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Type de congé *</Text>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={Object.entries(leaveTypes)}
                                keyExtractor={([key]) => key}
                                renderItem={({ item: [key, value] }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.leaveTypeChip,
                                            leaveForm.type === key && { backgroundColor: value.color, borderColor: value.color },
                                        ]}
                                        onPress={() => setLeaveForm(prev => ({ ...prev, type: key }))}
                                    >
                                        <Text style={[
                                            styles.leaveTypeChipText,
                                            leaveForm.type === key && styles.leaveTypeChipTextActive,
                                        ]}>
                                            {value.label}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        <View style={styles.formRow}>
                            <View style={[styles.formGroup, styles.halfGroup]}>
                                <Text style={styles.formLabel}>Date de début *</Text>
                                <DateTimePicker
                                    value={leaveForm.startDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, date) => {
                                        if (date) setLeaveForm(prev => ({ ...prev, startDate: date }));
                                    }}
                                    style={styles.datePicker}
                                />
                            </View>

                            <View style={[styles.formGroup, styles.halfGroup]}>
                                <Text style={styles.formLabel}>Date de fin *</Text>
                                <DateTimePicker
                                    value={leaveForm.endDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, date) => {
                                        if (date) setLeaveForm(prev => ({ ...prev, endDate: date }));
                                    }}
                                    style={styles.datePicker}
                                />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Motif (optionnel)</Text>
                            <TextInput
                                style={[styles.formInput, styles.formTextArea]}
                                placeholder="Raison du congé..."
                                multiline
                                numberOfLines={3}
                                value={leaveForm.reason}
                                onChangeText={(text) => setLeaveForm(prev => ({ ...prev, reason: text }))}
                                placeholderTextColor="#7F8C8D"
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => {
                            setShowLeaveModal(false);
                            setEditingLeave(null);
                        }}>
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleAddLeave}>
                            <Save size={20} color="#FFFFFF" />
                            <Text style={styles.saveButtonText}>Envoyer la demande</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.screen}>
            <Header />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Agenda & Absences</Text>
                        <Text style={styles.subtitle}>
                            {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.dateButton}>
                        <Calendar size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'agenda' && styles.tabActive]}
                        onPress={() => setActiveTab('agenda')}
                    >
                        <Clock size={20} color={activeTab === 'agenda' ? COLORS.primary : '#7F8C8D'} />
                        <Text style={[styles.tabText, activeTab === 'agenda' && styles.tabTextActive]}>
                            Agenda du jour
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'leaves' && styles.tabActive]}
                        onPress={() => setActiveTab('leaves')}
                    >
                        <Briefcase size={20} color={activeTab === 'leaves' ? COLORS.primary : '#7F8C8D'} />
                        <Text style={[styles.tabText, activeTab === 'leaves' && styles.tabTextActive]}>
                            Congés & Absences
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                {activeTab === 'agenda' && (
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            <Search size={20} color="#7F8C8D" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Rechercher par client, service, coiffeur..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor="#7F8C8D"
                            />
                        </View>
                    </View>
                )}

                {/* Content */}
                {activeTab === 'agenda' ? renderAgendaTab() : renderLeavesTab()}

                {/* Modals */}
                {renderDetailsModal()}
                {renderWalkInModal()}
                {renderLeaveModal()}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: COLORS.fond,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 14,
        color: '#7F8C8D',
        marginTop: 4,
    },
    dateButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 16,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
    },
    tabActive: {
        backgroundColor: `${COLORS.primary}15`,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#7F8C8D',
    },
    tabTextActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: COLORS.text,
    },
    filterContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    filterChipText: {
        fontSize: 13,
        color: '#7F8C8D',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    hairdresserSection: {
        marginBottom: 20,
        marginHorizontal: 16,
    },
    hairdresserHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    hairdresserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    hairdresserBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hairdresserInitial: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    hairdresserName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: COLORS.card,
    },
    callButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    appointmentCard: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        marginTop: 8,
        padding: 14,
        flexDirection: 'row',
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    appointmentTime: {
        width: 65,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
        marginRight: 12,
    },
    appointmentTimeText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    appointmentDuration: {
        fontSize: 10,
        color: '#95A5A6',
        marginTop: 2,
    },
    appointmentInfo: {
        flex: 1,
    },
    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    clientName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    serviceName: {
        fontSize: 12,
        color: '#7F8C8D',
        marginBottom: 4,
    },
    appointmentStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '500',
    },
    appointmentDetails: {
        flexDirection: 'row',
        gap: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    appointmentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F8F9FA',
    },
    actionIcon: {
        padding: 6,
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
    },
    emptyAppointments: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        marginTop: 8,
    },
    emptyText: {
        fontSize: 13,
        color: '#95A5A6',
    },
    walkInSection: {
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    addButtonText: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    walkInCard: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    walkInInfo: {
        flex: 1,
    },
    walkInName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    walkInService: {
        fontSize: 12,
        color: '#7F8C8D',
        marginBottom: 4,
    },
    walkInMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    walkInTime: {
        fontSize: 11,
        color: '#95A5A6',
    },
    walkInWait: {
        fontSize: 11,
        color: '#F39C12',
    },
    walkInActions: {
        flexDirection: 'row',
        gap: 10,
    },
    walkInActionButton: {
        padding: 8,
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
    },
    walkInAcceptButton: {
        backgroundColor: '#27AE6015',
    },
    emptyWalkIn: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
    },
    availableSlotsSection: {
        marginHorizontal: 16,
        marginBottom: 30,
    },
    slotsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    slotCard: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        minWidth: 80,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    slotTime: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
        marginTop: 6,
    },
    slotStatus: {
        fontSize: 10,
        color: '#27AE60',
        marginTop: 4,
    },
    // Congés Styles
    addLeaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        marginHorizontal: 16,
        marginBottom: 20,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    addLeaveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    leavesSection: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    leaveCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    leaveHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderLeftWidth: 4,
        backgroundColor: '#F8F9FA',
    },
    leaveHairdresser: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    leaveType: {
        fontSize: 12,
        color: '#7F8C8D',
        marginTop: 2,
    },
    leaveStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    leaveStatusText: {
        fontSize: 10,
        fontWeight: '500',
    },
    leaveDetails: {
        padding: 14,
    },
    leaveDateRange: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    leaveDateText: {
        fontSize: 13,
        color: '#2C3E50',
    },
    leaveReason: {
        fontSize: 12,
        color: '#7F8C8D',
        marginTop: 6,
        lineHeight: 16,
    },
    leaveActions: {
        flexDirection: 'row',
        padding: 12,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    leaveActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    approveButton: {
        backgroundColor: '#27AE60',
    },
    rejectButton: {
        backgroundColor: '#E74C3C',
    },
    leaveActionText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    historyCard: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    historyHairdresser: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    historyStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    historyStatusText: {
        fontSize: 10,
        fontWeight: '500',
    },
    historyDate: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    historyFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    approvedBy: {
        fontSize: 11,
        color: '#95A5A6',
    },
    approvedDate: {
        fontSize: 11,
        color: '#95A5A6',
    },
    calendarSection: {
        marginHorizontal: 16,
        marginBottom: 30,
    },
    calendarPlaceholder: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    calendarPlaceholderText: {
        fontSize: 14,
        color: '#7F8C8D',
        marginTop: 12,
    },
    calendarSubtext: {
        fontSize: 11,
        color: '#95A5A6',
        marginTop: 6,
        textAlign: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: screenHeight * 0.9,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    modalScroll: {
        maxHeight: screenHeight * 0.6,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
    },
    modalFooter: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        gap: 12,
    },
    formGroup: {
        marginHorizontal: 20,
        marginBottom: 16,
    },
    formRow: {
        flexDirection: 'row',
        marginHorizontal: 20,
        gap: 12,
    },
    halfGroup: {
        flex: 1,
        marginHorizontal: 0,
    },
    formLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#7F8C8D',
        marginBottom: 6,
    },
    formInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.text,
        backgroundColor: COLORS.card,
    },
    formTextArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    datePicker: {
        height: 50,
    },
    serviceChip: {
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    serviceChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    serviceChipText: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    serviceChipTextActive: {
        color: '#FFFFFF',
    },
    hairdresserChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
    },
    hairdresserChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    hairdresserDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    hairdresserChipText: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    hairdresserChipTextActive: {
        color: '#FFFFFF',
    },
    leaveTypeChip: {
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    leaveTypeChipText: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    leaveTypeChipTextActive: {
        color: '#FFFFFF',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#7F8C8D',
        fontWeight: '500',
    },
    saveButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    saveButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    // Détails Modal
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    detailsClientName: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
    },
    detailsStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },
    detailsStatusText: {
        fontSize: 13,
        fontWeight: '500',
    },
    detailsSection: {
        marginHorizontal: 20,
        marginTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    detailsSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    detailsInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    detailsInfoText: {
        fontSize: 14,
        color: '#2C3E50',
    },
    detailsNotes: {
        fontSize: 14,
        color: '#7F8C8D',
        lineHeight: 20,
    },
    detailsFooter: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        gap: 12,
    },
    detailsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    arrivedButton: {
        backgroundColor: '#27AE60',
    },
    inProgressButton: {
        backgroundColor: '#3498DB',
    },
    completeButton: {
        backgroundColor: '#9B59B6',
    },
    absentButton: {
        backgroundColor: '#E74C3C',
    },
    detailsButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    emptyState: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
    },
});

export default DailyAgendaAbsencesScreen;