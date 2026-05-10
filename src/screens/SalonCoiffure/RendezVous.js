// Dashboard salon — rendez-vous & planning (JS)
import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
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
    MoreVertical,
    MapPin,
    Phone,
    Mail,
} from 'lucide-react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Header from '../../componants/Header';
import COLORS from '../../constants/couleurs';

const DEFAULT_RDV_HAIRDRESSER = 'Non assigné';
const DEFAULT_RDV_HAIRDRESSER_COLOR = '#95A5A6';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const isSameDay = (d1, d2) => {
    const a = d1 instanceof Date ? d1 : new Date(d1);
    const b = d2 instanceof Date ? d2 : new Date(d2);
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
};

const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getStartOfCalendar = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    const day = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
    return d;
};

const parseTime = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const formatDateDisplay = (d) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Données simulées
const hairdressers = [
    { id: '1', name: 'Sophie Martin', color: '#E67E22' },
    { id: '2', name: 'Marc Laurent', color: '#9B59B6' },
    { id: '3', name: 'Julie Petit', color: '#3498DB' },
    { id: '4', name: 'Alexandre Roy', color: '#1ABC9C' },
];

const services = [
    { id: '1', name: 'Coupe Homme', duration: 30, price: 35 },
    { id: '2', name: 'Coupe Femme', duration: 45, price: 45 },
    { id: '3', name: 'Coloration', duration: 90, price: 80 },
    { id: '4', name: 'Brushing', duration: 30, price: 25 },
    { id: '5', name: 'Lissage', duration: 120, price: 120 },
    { id: '6', name: 'Mèches', duration: 90, price: 90 },
];

const mockAppointments = [
    {
        id: '1',
        clientName: 'Sophie Lambert',
        clientPhone: '06 12 34 56 78',
        clientEmail: 'sophie@email.com',
        service: 'Coupe Femme',
        servicePrice: 45,
        serviceDuration: 45,
        hairdresser: 'Sophie Martin',
        hairdresserColor: '#E67E22',
        date: new Date(2026, 2, 28, 9, 0),
        startTime: '09:00',
        endTime: '09:45',
        status: 'confirmed',
        notes: 'Préfère une coupe dégradée',
    },
    {
        id: '2',
        clientName: 'Thomas Dubois',
        clientPhone: '06 23 45 67 89',
        clientEmail: 'thomas@email.com',
        service: 'Coupe Homme',
        servicePrice: 35,
        serviceDuration: 30,
        hairdresser: 'Marc Laurent',
        hairdresserColor: '#9B59B6',
        date: new Date(2026, 2, 28, 10, 0),
        startTime: '10:00',
        endTime: '10:30',
        status: 'confirmed',
    },
    {
        id: '3',
        clientName: 'Julie Martin',
        clientPhone: '06 34 56 78 90',
        clientEmail: 'julie@email.com',
        service: 'Coloration',
        servicePrice: 80,
        serviceDuration: 90,
        hairdresser: 'Julie Petit',
        hairdresserColor: '#3498DB',
        date: new Date(2026, 2, 28, 11, 0),
        startTime: '11:00',
        endTime: '12:30',
        status: 'pending',
    },
    {
        id: '4',
        clientName: 'Nicolas Petit',
        clientPhone: '06 45 67 89 01',
        clientEmail: 'nicolas@email.com',
        service: 'Coupe Homme',
        servicePrice: 35,
        serviceDuration: 30,
        hairdresser: 'Alexandre Roy',
        hairdresserColor: '#1ABC9C',
        date: new Date(2026, 2, 28, 14, 0),
        startTime: '14:00',
        endTime: '14:30',
        status: 'confirmed',
        arrived: false,
    },
];

const RendezVous = () => {
    const insets = useSafeAreaInsets();
    const [viewType, setViewType] = useState('day');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState(mockAppointments);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedHairdresser, setSelectedHairdresser] = useState('all');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Formulaire nouveau rendez-vous
    const [newAppointment, setNewAppointment] = useState({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        service: '',
        date: new Date(),
        startTime: '09:00',
        notes: '',
    });

    const serviceDropdownData = useMemo(
        () =>
            services.map((s) => ({
                label: `${s.name} (${s.duration} min · ${s.price} €)`,
                value: s.name,
            })),
        []
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return '#27AE60';
            case 'pending': return '#F39C12';
            case 'cancelled': return '#E74C3C';
            case 'completed': return '#3498DB';
            default: return '#95A5A6';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'confirmed': return <CheckCircle size={16} color="#27AE60" />;
            case 'pending': return <AlertCircle size={16} color="#F39C12" />;
            case 'cancelled': return <XCircle size={16} color="#E74C3C" />;
            case 'completed': return <Check size={16} color="#3498DB" />;
            default: return null;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'confirmed': return 'Confirmé';
            case 'pending': return 'En attente';
            case 'cancelled': return 'Annulé';
            case 'completed': return 'Terminé';
            default: return status;
        }
    };

    const handleUpdateStatus = (appointment, newStatus) => {
        setAppointments(prev =>
            prev.map(apt =>
                apt.id === appointment.id ? { ...apt, status: newStatus } : apt
            )
        );
        Alert.alert('Succès', `Rendez-vous marqué comme ${getStatusText(newStatus)}`);
    };

    const handleMarkArrived = (appointment) => {
        setAppointments(prev =>
            prev.map(apt =>
                apt.id === appointment.id ? { ...apt, arrived: true } : apt
            )
        );
        Alert.alert('Succès', 'Client marqué comme arrivé');
    };

    const handleDeleteAppointment = (appointment) => {
        Alert.alert(
            'Annuler le rendez-vous',
            `Voulez-vous vraiment annuler le rendez-vous de ${appointment.clientName} ?`,
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui',
                    onPress: () => {
                        handleUpdateStatus(appointment, 'cancelled');
                        setShowDetailsModal(false);
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const closeAddModal = () => {
        setShowDatePicker(false);
        setShowTimePicker(false);
        setShowAddModal(false);
    };

    const openAddModal = () => {
        setShowDatePicker(false);
        setShowTimePicker(false);
        setShowAddModal(true);
    };

    const getTimePickerDate = () => {
        const [hours, minutes] = newAppointment.startTime.split(':').map(Number);
        const baseDate = new Date(newAppointment.date);
        baseDate.setHours(hours, minutes, 0, 0);
        return baseDate;
    };

    const handleAndroidDateChange = (event, date) => {
        setShowDatePicker(false);
        if (event?.type === 'dismissed') {
            return;
        }
        if (date) {
            setNewAppointment((prev) => ({ ...prev, date }));
        }
    };

    const handleAndroidTimeChange = (event, time) => {
        setShowTimePicker(false);
        if (event?.type === 'dismissed') {
            return;
        }
        if (time) {
            const hours = time.getHours().toString().padStart(2, '0');
            const minutes = time.getMinutes().toString().padStart(2, '0');
            setNewAppointment((prev) => ({ ...prev, startTime: `${hours}:${minutes}` }));
        }
    };

    const handleAddAppointment = () => {
        if (!newAppointment.clientName || !newAppointment.service) {
            Alert.alert('Erreur', 'Veuillez remplir le nom du client et choisir un service');
            return;
        }

        const selectedService = services.find((s) => s.name === newAppointment.service);

        const newId = (appointments.length + 1).toString();
        const appointmentDate = new Date(newAppointment.date);
        const [startHour, startMinute] = newAppointment.startTime.split(':').map(Number);
        appointmentDate.setHours(startHour, startMinute);

        const endDate = new Date(appointmentDate);
        endDate.setMinutes(endDate.getMinutes() + (selectedService?.duration || 30));

        const appointment = {
            id: newId,
            clientName: newAppointment.clientName,
            clientPhone: newAppointment.clientPhone,
            clientEmail: newAppointment.clientEmail,
            service: newAppointment.service,
            servicePrice: selectedService?.price || 0,
            serviceDuration: selectedService?.duration || 30,
            hairdresser: DEFAULT_RDV_HAIRDRESSER,
            hairdresserColor: DEFAULT_RDV_HAIRDRESSER_COLOR,
            date: appointmentDate,
            startTime: newAppointment.startTime,
            endTime: `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
            status: 'confirmed',
            notes: newAppointment.notes,
        };

        setAppointments(prev => [...prev, appointment]);
        closeAddModal();
        setNewAppointment({
            clientName: '',
            clientPhone: '',
            clientEmail: '',
            service: '',
            date: new Date(),
            startTime: '09:00',
            notes: '',
        });
        Alert.alert('Succès', 'Rendez-vous ajouté avec succès');
    };

    const appointmentsMatchingFilters = useMemo(() => {
        return appointments.filter((apt) => {
            const matchesSearch =
                searchQuery === '' ||
                apt.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                apt.hairdresser.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesHairdresser =
                selectedHairdresser === 'all' || apt.hairdresser === selectedHairdresser;

            return matchesSearch && matchesHairdresser;
        });
    }, [appointments, searchQuery, selectedHairdresser]);

    const filteredAppointments = useMemo(() => {
        return appointmentsMatchingFilters.filter((apt) =>
            isSameDay(new Date(apt.date), selectedDate)
        );
    }, [appointmentsMatchingFilters, selectedDate]);

    const renderAppointmentCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.appointmentCard, { borderLeftColor: item.hairdresserColor }]}
            onPress={() => {
                setSelectedAppointment(item);
                setShowDetailsModal(true);
            }}
        >
            <View style={styles.appointmentTime}>
                <Text style={styles.appointmentTimeText}>{item.startTime}</Text>
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
                        <Text style={styles.detailText}>{item.hairdresser}</Text>
                    </View>
                </View>

                {item.arrived && (
                    <View style={styles.arrivedBadge}>
                        <UserCheck size={12} color="#27AE60" />
                        <Text style={styles.arrivedText}>Arrivé</Text>
                    </View>
                )}
            </View>

            <View style={styles.appointmentActions}>
                {!item.arrived && item.status === 'confirmed' && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleMarkArrived(item)}
                    >
                        <UserCheck size={18} color="#27AE60" />
                    </TouchableOpacity>
                )}
                {item.status === 'confirmed' && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleUpdateStatus(item, 'completed')}
                    >
                        <Check size={18} color="#3498DB" />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderMonthCalendarGrid = (anchorDate, { interactive, onDayPress } = {}) => {
        const year = anchorDate.getFullYear();
        const month = anchorDate.getMonth();
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDate = getStartOfCalendar(anchorDate);

        const weeks = [];
        let currentDate = new Date(startDate);

        while (currentDate <= lastDayOfMonth || weeks.length < 6) {
            const week = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(currentDate);
                const dayAppointments = appointmentsMatchingFilters.filter((apt) =>
                    isSameDay(new Date(apt.date), date)
                );
                week.push({ date, appointments: dayAppointments });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            weeks.push(week);
        }

        return (
            <View style={[styles.monthContainer, interactive && styles.monthContainerInModal]}>
                <View style={styles.monthHeader}>
                    {WEEKDAY_LABELS.map((day, index) => (
                        <View key={index} style={styles.monthDayHeader}>
                            <Text style={styles.monthDayName}>{day}</Text>
                        </View>
                    ))}
                </View>
                {weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={styles.monthWeek}>
                        {week.map(({ date, appointments: dayAppointments }, dayIndex) => {
                            const isCurrentMonth = date.getMonth() === month;
                            const isToday = isSameDay(date, new Date());
                            const isSelected = isSameDay(date, selectedDate);
                            const dayCellStyle = [
                                styles.monthDay,
                                !isCurrentMonth && styles.monthDayOther,
                                isToday && styles.monthDayToday,
                                isSelected && styles.monthDaySelected,
                            ];

                            const inner = (
                                <>
                                    <Text
                                        style={[
                                            styles.monthDayNumber,
                                            !isCurrentMonth && styles.monthDayNumberOther,
                                            isToday && styles.monthDayNumberToday,
                                        ]}
                                    >
                                        {date.getDate()}
                                    </Text>
                                    {dayAppointments.length > 0 && (
                                        <View style={styles.monthAppointmentIndicator}>
                                            <Text style={styles.monthAppointmentCount}>
                                                {dayAppointments.length}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            );

                            if (interactive && onDayPress) {
                                return (
                                    <TouchableOpacity
                                        key={dayIndex}
                                        style={dayCellStyle}
                                        onPress={() => onDayPress(date)}
                                        activeOpacity={0.75}
                                    >
                                        {inner}
                                    </TouchableOpacity>
                                );
                            }

                            return (
                                <View key={dayIndex} style={dayCellStyle}>
                                    {inner}
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>
        );
    };

    const renderAgendaList = () => (
        <FlatList
            data={[...filteredAppointments].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))}
            keyExtractor={(item) => item.id}
            renderItem={renderAppointmentCard}
            contentContainerStyle={styles.appointmentsList}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Calendar size={48} color="#BDC3C7" />
                    <Text style={styles.emptyStateText}>Aucun rendez-vous pour cette journée</Text>
                    <TouchableOpacity style={styles.emptyStateButton} onPress={openAddModal}>
                        <Plus size={20} color="#FFFFFF" />
                        <Text style={styles.emptyStateButtonText}>Ajouter un rendez-vous</Text>
                    </TouchableOpacity>
                </View>
            }
        />
    );

    const renderDayView = () => renderAgendaList();

    const renderWeekView = () => renderAgendaList();

    const renderMonthView = () => (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {renderMonthCalendarGrid(selectedDate, { interactive: false })}
        </ScrollView>
    );

    const renderAddModal = () => (
        <Modal
            visible={showAddModal}
            animationType="slide"
            transparent
            onRequestClose={closeAddModal}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Nouveau rendez-vous</Text>
                        <TouchableOpacity onPress={closeAddModal}>
                            <XCircle size={24} color="#7F8C8D" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Nom du client *</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Nom et prénom"
                                value={newAppointment.clientName}
                                onChangeText={(text) => setNewAppointment({ ...newAppointment, clientName: text })}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Téléphone</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="06 12 34 56 78"
                                keyboardType="phone-pad"
                                value={newAppointment.clientPhone}
                                onChangeText={(text) => setNewAppointment({ ...newAppointment, clientPhone: text })}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Email</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="client@email.com"
                                keyboardType="email-address"
                                value={newAppointment.clientEmail}
                                onChangeText={(text) => setNewAppointment({ ...newAppointment, clientEmail: text })}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Service *</Text>
                            <Dropdown
                                style={styles.serviceDropdown}
                                placeholderStyle={styles.serviceDropdownPlaceholder}
                                selectedTextStyle={styles.serviceDropdownSelected}
                                inputSearchStyle={styles.serviceDropdownSearch}
                                data={serviceDropdownData}
                                search
                                maxHeight={280}
                                labelField="label"
                                valueField="value"
                                placeholder="Choisir un service"
                                searchPlaceholder="Rechercher..."
                                value={newAppointment.service}
                                onChange={(item) =>
                                    setNewAppointment((prev) => ({ ...prev, service: item.value }))
                                }
                                containerStyle={styles.serviceDropdownContainer}
                                itemTextStyle={styles.serviceDropdownItemText}
                                flatListProps={{
                                    bounces: false,
                                    contentContainerStyle: { paddingBottom: 16 },
                                }}
                            />
                        </View>

                        <View style={styles.formRow}>
                            <View style={[styles.formGroup, styles.formGroupHalf]}>
                                <Text style={styles.formLabel}>Date</Text>
                                {Platform.OS === 'ios' ? (
                                    <DateTimePicker
                                        value={newAppointment.date}
                                        mode="date"
                                        display="compact"
                                        onChange={(event, date) => {
                                            if (date) {
                                                setNewAppointment((prev) => ({ ...prev, date }));
                                            }
                                        }}
                                        style={styles.datePickerCompact}
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={styles.pickerButton}
                                        onPress={() => {
                                            setShowTimePicker(false);
                                            setShowDatePicker(true);
                                        }}
                                    >
                                        <Text style={styles.pickerButtonText}>
                                            {formatDateDisplay(newAppointment.date)}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={[styles.formGroup, styles.formGroupHalf]}>
                                <Text style={styles.formLabel}>Heure</Text>
                                {Platform.OS === 'ios' ? (
                                    <DateTimePicker
                                        value={getTimePickerDate()}
                                        mode="time"
                                        display="compact"
                                        onChange={(event, time) => {
                                            if (time) {
                                                const hours = time.getHours().toString().padStart(2, '0');
                                                const minutes = time.getMinutes().toString().padStart(2, '0');
                                                setNewAppointment((prev) => ({
                                                    ...prev,
                                                    startTime: `${hours}:${minutes}`,
                                                }));
                                            }
                                        }}
                                        style={styles.datePickerCompact}
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={styles.pickerButton}
                                        onPress={() => {
                                            setShowDatePicker(false);
                                            setShowTimePicker(true);
                                        }}
                                    >
                                        <Text style={styles.pickerButtonText}>{newAppointment.startTime}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Notes</Text>
                            <TextInput
                                style={[styles.formInput, styles.formTextArea]}
                                placeholder="Préférences, allergies, etc."
                                multiline
                                numberOfLines={3}
                                value={newAppointment.notes}
                                onChangeText={(text) => setNewAppointment({ ...newAppointment, notes: text })}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleAddAppointment}>
                            <Text style={styles.saveButtonText}>Ajouter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderDetailsModal = () => (
        <Modal
            visible={showDetailsModal}
            animationType="slide"
            transparent
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
                                        <Text style={styles.detailsInfoText}>
                                            {selectedAppointment.startTime} - {selectedAppointment.endTime}
                                        </Text>
                                    </View>
                                    <View style={styles.detailsInfoRow}>
                                        <Scissors size={18} color="#7F8C8D" />
                                        <Text style={styles.detailsInfoText}>
                                            {selectedAppointment.service} ({selectedAppointment.serviceDuration} min - {selectedAppointment.servicePrice}€)
                                        </Text>
                                    </View>
                                    <View style={styles.detailsInfoRow}>
                                        <User size={18} color="#7F8C8D" />
                                        <Text style={styles.detailsInfoText}>{selectedAppointment.hairdresser}</Text>
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
                                {selectedAppointment.status === 'confirmed' && !selectedAppointment.arrived && (
                                    <TouchableOpacity
                                        style={[styles.detailsButton, styles.arrivedButton]}
                                        onPress={() => {
                                            handleMarkArrived(selectedAppointment);
                                            setShowDetailsModal(false);
                                        }}
                                    >
                                        <UserCheck size={20} color="#FFFFFF" />
                                        <Text style={styles.detailsButtonText}>Marquer arrivé</Text>
                                    </TouchableOpacity>
                                )}
                                {selectedAppointment.status === 'confirmed' && (
                                    <TouchableOpacity
                                        style={[styles.detailsButton, styles.completeButton]}
                                        onPress={() => {
                                            handleUpdateStatus(selectedAppointment, 'completed');
                                            setShowDetailsModal(false);
                                        }}
                                    >
                                        <Check size={20} color="#FFFFFF" />
                                        <Text style={styles.detailsButtonText}>Terminer</Text>
                                    </TouchableOpacity>
                                )}
                                {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                                    <TouchableOpacity
                                        style={[styles.detailsButton, styles.cancelActionButton]}
                                        onPress={() => handleDeleteAppointment(selectedAppointment)}
                                    >
                                        <Trash2 size={20} color="#FFFFFF" />
                                        <Text style={styles.detailsButtonText}>Annuler</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );

    const renderFilterModal = () => {
        const weekStart = getStartOfWeek(selectedDate);
        const weekDates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            return d;
        });

        return (
            <Modal
                visible={showFilterModal}
                animationType="slide"
                presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
                onRequestClose={() => setShowFilterModal(false)}
            >
                <SafeAreaView style={styles.filterModalScreen} edges={['top', 'right', 'left', 'bottom']}>
                    <View style={styles.filterModalTopBar}>
                        <Text style={styles.filterModalTitle}>Filtres & affichage</Text>
                        <TouchableOpacity
                            onPress={() => setShowFilterModal(false)}
                            style={styles.filterModalClose}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <XCircle size={28} color="#7F8C8D" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.filterModalScrollContent}
                    >
                        <View style={[styles.dateNavigation, styles.dateNavigationInModal]}>
                            <TouchableOpacity
                                onPress={() => {
                                    const newDate = new Date(selectedDate);
                                    if (viewType === 'day') newDate.setDate(newDate.getDate() - 1);
                                    else if (viewType === 'week') newDate.setDate(newDate.getDate() - 7);
                                    else newDate.setMonth(newDate.getMonth() - 1);
                                    setSelectedDate(newDate);
                                }}
                            >
                                <ChevronLeft size={24} color="#E67E22" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
                                <Text style={styles.dateText}>
                                    {viewType === 'day' &&
                                        selectedDate.toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    {viewType === 'week' &&
                                        `Semaine du ${selectedDate.toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                        })}`}
                                    {viewType === 'month' &&
                                        selectedDate.toLocaleDateString('fr-FR', {
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    const newDate = new Date(selectedDate);
                                    if (viewType === 'day') newDate.setDate(newDate.getDate() + 1);
                                    else if (viewType === 'week') newDate.setDate(newDate.getDate() + 7);
                                    else newDate.setMonth(newDate.getMonth() + 1);
                                    setSelectedDate(newDate);
                                }}
                            >
                                <ChevronRight size={24} color="#E67E22" />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.viewSelector, styles.viewSelectorInModal]}>
                            {['day', 'week', 'month'].map((view) => (
                                <TouchableOpacity
                                    key={view}
                                    style={[styles.viewButton, viewType === view && styles.viewButtonActive]}
                                    onPress={() => setViewType(view)}
                                >
                                    <Text
                                        style={[
                                            styles.viewButtonText,
                                            viewType === view && styles.viewButtonTextActive,
                                        ]}
                                    >
                                        {view === 'day' ? 'Jour' : view === 'week' ? 'Semaine' : 'Mois'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {viewType === 'week' && (
                            <View style={styles.filterModalSection}>
                                <Text style={styles.filterModalSectionTitle}>Jour de la semaine</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.weekdayPickerScroll}
                                >
                                    {weekDates.map((date, index) => {
                                        const selected = isSameDay(date, selectedDate);
                                        return (
                                            <TouchableOpacity
                                                key={WEEKDAY_LABELS[index]}
                                                style={[styles.weekdayPickerChip, selected && styles.weekdayPickerChipActive]}
                                                onPress={() => setSelectedDate(date)}
                                                activeOpacity={0.8}
                                            >
                                                <Text
                                                    style={[
                                                        styles.weekdayPickerLabel,
                                                        selected && styles.weekdayPickerLabelActive,
                                                    ]}
                                                >
                                                    {WEEKDAY_LABELS[index]}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.weekdayPickerDateNum,
                                                        selected && styles.weekdayPickerDateNumActive,
                                                    ]}
                                                >
                                                    {date.getDate()}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}

                        {viewType === 'month' && (
                            <View style={styles.filterModalSection}>
                                <Text style={styles.filterModalSectionTitle}>Calendrier</Text>
                                {renderMonthCalendarGrid(selectedDate, {
                                    interactive: true,
                                    onDayPress: (d) => setSelectedDate(d),
                                })}
                            </View>
                        )}

                        <View style={[styles.searchContainer, styles.searchContainerInModal]}>
                            <View style={styles.searchBar}>
                                <Search size={20} color="#7F8C8D" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Rechercher par client, service, coiffeur..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>

                            <View style={[styles.filterContainer, styles.filterChipsWrap]}>
                                {[{ id: 'all', name: 'Tous' }, ...hairdressers].map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.filterChip,
                                            selectedHairdresser === (item.id === 'all' ? 'all' : item.name) &&
                                                styles.filterChipActive,
                                        ]}
                                        onPress={() =>
                                            setSelectedHairdresser(item.id === 'all' ? 'all' : item.name)
                                        }
                                    >
                                        {'color' in item && (
                                            <View style={[styles.filterDot, { backgroundColor: item.color }]} />
                                        )}
                                        <Text
                                            style={[
                                                styles.filterChipText,
                                                selectedHairdresser === (item.id === 'all' ? 'all' : item.name) &&
                                                    styles.filterChipTextActive,
                                            ]}
                                        >
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Header />
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Rendez-vous</Text>
                    <Text style={styles.subtitle}>Gérez l'agenda du salon</Text>
                </View>
                <TouchableOpacity
                    style={styles.filterHeaderButton}
                    onPress={() => setShowFilterModal(true)}
                    accessibilityLabel="Filtres et affichage"
                >
                    <Filter size={22} color="#E67E22" />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            {viewType === 'day' && renderDayView()}
            {viewType === 'week' && renderWeekView()}
            {viewType === 'month' && renderMonthView()}

            <TouchableOpacity
                style={[styles.fab, { bottom: 24 + insets.bottom }]}
                onPress={openAddModal}
                activeOpacity={0.9}
                accessibilityLabel="Ajouter un rendez-vous"
            >
                <Plus size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Modals */}
            {renderFilterModal()}
            {renderAddModal()}
            {renderDetailsModal()}

            {Platform.OS === 'android' && showAddModal && showDatePicker ? (
                <DateTimePicker
                    value={newAppointment.date}
                    mode="date"
                    display="default"
                    onChange={handleAndroidDateChange}
                />
            ) : null}
            {Platform.OS === 'android' && showAddModal && showTimePicker ? (
                <DateTimePicker
                    value={getTimePickerDate()}
                    mode="time"
                    display="default"
                    onChange={handleAndroidTimeChange}
                />
            ) : null}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.fond,
        position: 'relative',
    },
    screen: {
        flex: 1,
        backgroundColor: COLORS.fond,
    },
    filterModalScreen: {
        flex: 1,
        backgroundColor: COLORS.fond,
    },
    filterModalTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ECF0F1',
        backgroundColor: '#FFFFFF',
    },
    filterModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A2C3E',
    },
    filterModalClose: {
        padding: 4,
    },
    filterModalSection: {
        marginTop: 8,
        marginBottom: 4,
    },
    filterModalSectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7F8C8D',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    weekdayPickerScroll: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
        paddingRight: 8,
    },
    weekdayPickerChip: {
        width: 64,
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#ECF0F1',
        alignItems: 'center',
    },
    weekdayPickerChipActive: {
        backgroundColor: '#E67E22',
        borderColor: '#E67E22',
    },
    weekdayPickerLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#7F8C8D',
    },
    weekdayPickerLabelActive: {
        color: '#FFFFFF',
    },
    weekdayPickerDateNum: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A2C3E',
        marginTop: 2,
    },
    weekdayPickerDateNumActive: {
        color: '#FFFFFF',
    },
    filterModalScrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 40,
    },
    dateNavigationInModal: {
        marginHorizontal: 0,
        marginTop: 0,
    },
    viewSelectorInModal: {
        marginHorizontal: 0,
        marginTop: 16,
        marginBottom: 12,
    },
    searchContainerInModal: {
        paddingHorizontal: 0,
        marginBottom: 0,
    },
    filterHeaderButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#ECF0F1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E67E22',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E67E22',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
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
        color: '#1A2C3E',
    },
    subtitle: {
        fontSize: 14,
        color: '#7F8C8D',
        marginTop: 4,
    },
    addButton: {
        backgroundColor: '#E67E22',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E67E22',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    dateNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1A2C3E',
    },
    viewSelector: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    viewButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    viewButtonActive: {
        backgroundColor: '#E67E22',
    },
    viewButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#7F8C8D',
    },
    viewButtonTextActive: {
        color: '#FFFFFF',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#ECF0F1',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#1A2C3E',
    },
    filterContainer: {
        marginTop: 12,
    },
    filterChipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#ECF0F1',
    },
    filterChipActive: {
        backgroundColor: '#E67E22',
        borderColor: '#E67E22',
    },
    filterDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    filterChipText: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    appointmentsList: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    appointmentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
        padding: 14,
        flexDirection: 'row',
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    appointmentTime: {
        width: 70,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: '#ECF0F1',
        marginRight: 12,
    },
    appointmentTimeText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A2C3E',
    },
    appointmentDuration: {
        fontSize: 10,
        color: '#95A5A6',
        marginTop: 4,
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
        fontSize: 16,
        fontWeight: '600',
        color: '#1A2C3E',
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
        fontSize: 10,
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
    arrivedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#27AE6015',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 6,
        alignSelf: 'flex-start',
        gap: 4,
    },
    arrivedText: {
        fontSize: 10,
        color: '#27AE60',
        fontWeight: '500',
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
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#95A5A6',
        marginTop: 12,
        marginBottom: 20,
    },
    emptyStateButton: {
        flexDirection: 'row',
        backgroundColor: '#E67E22',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
    },
    emptyStateButtonText: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    weekContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    weekDayColumn: {
        width: (screenWidth - 32) / 3.5,
        marginRight: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    weekDayHeader: {
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ECF0F1',
        marginBottom: 12,
    },
    weekDayName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#7F8C8D',
    },
    weekDayDate: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A2C3E',
        marginTop: 4,
    },
    weekAppointmentCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
    },
    weekAppointmentTime: {
        fontSize: 12,
        fontWeight: '600',
        color: '#E67E22',
    },
    weekAppointmentClient: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1A2C3E',
        marginTop: 4,
    },
    weekAppointmentService: {
        fontSize: 10,
        color: '#95A5A6',
        marginTop: 2,
    },
    weekEmptyText: {
        fontSize: 11,
        color: '#BDC3C7',
        textAlign: 'center',
        paddingVertical: 20,
    },
    monthContainer: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        borderRadius: 20,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    monthContainerInModal: {
        marginHorizontal: 0,
        marginTop: 0,
        marginBottom: 0,
    },
    monthHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    monthDayHeader: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    monthDayName: {
        fontSize: 12,
        fontWeight: '500',
        color: '#7F8C8D',
    },
    monthWeek: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    monthDay: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        margin: 2,
    },
    monthDayOther: {
        opacity: 0.4,
    },
    monthDayToday: {
        backgroundColor: '#E67E2215',
    },
    monthDaySelected: {
        borderWidth: 2,
        borderColor: '#E67E22',
        backgroundColor: '#FDF6EE',
    },
    monthDayNumber: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1A2C3E',
    },
    monthDayNumberOther: {
        color: '#95A5A6',
    },
    monthDayNumberToday: {
        color: '#E67E22',
        fontWeight: '700',
    },
    monthAppointmentIndicator: {
        backgroundColor: '#E67E22',
        borderRadius: 10,
        minWidth: 20,
        paddingHorizontal: 4,
        paddingVertical: 2,
        marginTop: 4,
    },
    monthAppointmentCount: {
        fontSize: 9,
        color: '#FFFFFF',
        fontWeight: '600',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: screenHeight * 0.9,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ECF0F1',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A2C3E',
    },
    formGroup: {
        marginHorizontal: 20,
        marginTop: 16,
    },
    formLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#7F8C8D',
        marginBottom: 8,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#ECF0F1',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1A2C3E',
    },
    formTextArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    formRow: {
        flexDirection: 'row',
        marginHorizontal: 20,
        gap: 12,
    },
    formGroupHalf: {
        flex: 1,
        marginHorizontal: 0,
    },
    pickerButton: {
        borderWidth: 1,
        borderColor: '#ECF0F1',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    pickerButtonText: {
        fontSize: 14,
        color: '#1A2C3E',
    },
    datePickerCompact: {
        alignSelf: 'flex-start',
    },
    serviceDropdown: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#ECF0F1',
        borderRadius: 12,
        paddingHorizontal: 12,
        minHeight: 48,
    },
    serviceDropdownPlaceholder: {
        fontSize: 14,
        color: '#95A5A6',
    },
    serviceDropdownSelected: {
        fontSize: 14,
        color: '#1A2C3E',
        fontWeight: '600',
    },
    serviceDropdownSearch: {
        height: 40,
        fontSize: 14,
        color: '#1A2C3E',
    },
    serviceDropdownContainer: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    serviceDropdownItemText: {
        fontSize: 14,
        color: '#1A2C3E',
    },
    modalFooter: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 24,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ECF0F1',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#7F8C8D',
        fontWeight: '500',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#E67E22',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
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
        color: '#1A2C3E',
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
        borderBottomColor: '#ECF0F1',
    },
    detailsSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A2C3E',
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
    completeButton: {
        backgroundColor: '#3498DB',
    },
    cancelActionButton: {
        backgroundColor: '#E74C3C',
    },
    detailsButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default RendezVous;