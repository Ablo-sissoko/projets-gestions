// screens/TailoringMeasurementsScreen.js
import React, { useState, useRef } from 'react';
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
  Switch,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Ruler,
  Scissors,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  ChevronRight,
  ChevronLeft,
  Save,
  X,
  Camera,
  Upload,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  Search,
  Filter,
  Printer,
  Share2,
  Download,
  Eye,
  Briefcase,
  Award,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Star,
} from 'lucide-react-native';
import Header from '../../componants/Header';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Types de vêtements
const garmentTypes = [
  { id: 'suit', label: 'Costume', icon: '👔', steps: 7 },
  { id: 'shirt', label: 'Chemise', icon: '👕', steps: 5 },
  { id: 'pants', label: 'Pantalon', icon: '👖', steps: 6 },
  { id: 'jacket', label: 'Veste', icon: '🧥', steps: 8 },
  { id: 'dress', label: 'Robe', icon: '👗', steps: 9 },
  { id: 'skirt', label: 'Jupe', icon: '👘', steps: 5 },
];

// Étapes de production
const productionSteps = [
  { id: 'measurement', label: 'Prise de mesures', icon: '📏', color: '#3498DB', order: 1 },
  { id: 'pattern', label: 'Patronage', icon: '📐', color: '#9B59B6', order: 2 },
  { id: 'cutting', label: 'Coupe', icon: '✂️', color: '#E67E22', order: 3 },
  { id: 'firstFitting', label: 'Premier essayage', icon: '👘', color: '#F39C12', order: 4 },
  { id: 'finishing', label: 'Finitions', icon: '🪡', color: '#27AE60', order: 5 },
  { id: 'finalFitting', label: 'Essai final', icon: '✨', color: '#1ABC9C', order: 6 },
  { id: 'delivery', label: 'Livraison', icon: '📦', color: '#E74C3C', order: 7 },
];

// Types de mesures
const measurementCategories = [
  {
    id: 'upperBody',
    label: 'Haut du corps',
    measurements: [
      { id: 'chest', label: 'Tour de poitrine', unit: 'cm', min: 70, max: 150 },
      { id: 'waist', label: 'Tour de taille', unit: 'cm', min: 60, max: 140 },
      { id: 'hips', label: 'Tour de hanches', unit: 'cm', min: 70, max: 150 },
      { id: 'shoulderWidth', label: 'Largeur d\'épaules', unit: 'cm', min: 35, max: 60 },
      { id: 'backLength', label: 'Longueur dos', unit: 'cm', min: 35, max: 70 },
      { id: 'armLength', label: 'Longueur de manche', unit: 'cm', min: 50, max: 80 },
      { id: 'armhole', label: 'Tour d\'emmanchure', unit: 'cm', min: 35, max: 60 },
      { id: 'neck', label: 'Tour de cou', unit: 'cm', min: 30, max: 50 },
    ],
  },
  {
    id: 'lowerBody',
    label: 'Bas du corps',
    measurements: [
      { id: 'waistPants', label: 'Tour de taille (pantalon)', unit: 'cm', min: 60, max: 140 },
      { id: 'hipPants', label: 'Tour de hanches (pantalon)', unit: 'cm', min: 70, max: 150 },
      { id: 'thigh', label: 'Tour de cuisse', unit: 'cm', min: 40, max: 80 },
      { id: 'knee', label: 'Tour de genou', unit: 'cm', min: 30, max: 55 },
      { id: 'calf', label: 'Tour de mollet', unit: 'cm', min: 30, max: 55 },
      { id: 'inseam', label: 'Longueur d\'entrejambe', unit: 'cm', min: 70, max: 110 },
      { id: 'outseam', label: 'Longueur côté', unit: 'cm', min: 90, max: 130 },
    ],
  },
  {
    id: 'details',
    label: 'Détails & surmesures',
    measurements: [
      { id: 'shoulderSlope', label: 'Pente d\'épaule', unit: '°', min: 0, max: 30, type: 'angle' },
      { id: 'posture', label: 'Posture', unit: '', type: 'select', options: ['Normale', 'Voûtée', 'Cambrée'] },
      { id: 'shoulderType', label: 'Type d\'épaule', unit: '', type: 'select', options: ['Normale', 'Descendante', 'Montante'] },
      { id: 'belly', label: 'Ventre', unit: '', type: 'select', options: ['Normal', 'Proéminent', 'Plat'] },
      { id: 'backShape', label: 'Forme du dos', unit: '', type: 'select', options: ['Normal', 'Large', 'Étroits', 'Voûté'] },
    ],
  },
];

// Données simulées - Clients
const mockClients = [
  {
    id: '1',
    name: 'Jean Dupont',
    phone: '06 12 34 56 78',
    email: 'jean.dupont@email.com',
    createdAt: '2026-03-01',
    totalOrders: 3,
  },
  {
    id: '2',
    name: 'Marie Lambert',
    phone: '06 23 45 67 89',
    email: 'marie.lambert@email.com',
    createdAt: '2026-02-15',
    totalOrders: 1,
  },
];

// Données simulées - Commandes
const mockOrders = [
  {
    id: 'ORD-001',
    clientId: '1',
    clientName: 'Jean Dupont',
    garmentType: 'suit',
    garmentLabel: 'Costume 3 pièces',
    measurements: {
      chest: 98,
      waist: 85,
      hips: 100,
      shoulderWidth: 48,
      backLength: 48,
      armLength: 62,
      armhole: 48,
      neck: 40,
      waistPants: 85,
      hipPants: 100,
      thigh: 55,
      knee: 38,
      calf: 38,
      inseam: 82,
      outseam: 108,
      shoulderSlope: 15,
      posture: 'Normale',
      shoulderType: 'Normale',
      belly: 'Normal',
      backShape: 'Normal',
    },
    currentStep: 'pattern',
    stepHistory: [
      { step: 'measurement', completedAt: '2026-03-01 10:30', notes: 'Mesures prises avec succès' },
      { step: 'pattern', startedAt: '2026-03-02 09:00', notes: 'Patronage en cours' },
    ],
    fabric: 'Laine bleu marine',
    fabricReference: 'FAB-001',
    lining: 'Soie naturelle',
    buttons: 'Corne naturelle',
    specialRequests: 'Poches intérieures supplémentaires',
    price: 850,
    deposit: 400,
    remaining: 450,
    estimatedDelivery: '2026-03-25',
    notes: 'Client préfère une coupe ajustée',
    images: [],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-02',
  },
  {
    id: 'ORD-002',
    clientId: '2',
    clientName: 'Marie Lambert',
    garmentType: 'dress',
    garmentLabel: 'Robe de soirée',
    measurements: {
      chest: 88,
      waist: 68,
      hips: 94,
      shoulderWidth: 40,
      backLength: 42,
      armLength: 58,
      armhole: 42,
      neck: 36,
      waistPants: 68,
      hipPants: 94,
      thigh: 50,
      knee: 35,
      calf: 34,
      inseam: 75,
      outseam: 105,
      shoulderSlope: 10,
      posture: 'Normale',
      shoulderType: 'Normale',
      belly: 'Normal',
      backShape: 'Normal',
    },
    currentStep: 'measurement',
    stepHistory: [
      { step: 'measurement', startedAt: '2026-03-05 14:00', notes: 'Prise de mesures en cours' },
    ],
    fabric: 'Soie blanche',
    fabricReference: 'FAB-002',
    lining: 'Crêpe de Chine',
    buttons: 'Perles',
    specialRequests: 'Décolleté plongeant',
    price: 1200,
    deposit: 600,
    remaining: 600,
    estimatedDelivery: '2026-04-10',
    notes: 'Robe pour un mariage',
    images: [],
    createdAt: '2026-03-05',
    updatedAt: '2026-03-05',
  },
];

const TailoringMeasurementsScreen = () => {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'measurements', 'production'
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState(mockOrders);
  const [clients, setClients] = useState(mockClients);

  // Formulaire nouvelle commande
  const [orderForm, setOrderForm] = useState({
    clientId: '',
    garmentType: '',
    garmentLabel: '',
    fabric: '',
    fabricReference: '',
    lining: '',
    buttons: '',
    specialRequests: '',
    price: 0,
    deposit: 0,
    estimatedDelivery: new Date(),
    notes: '',
  });

  // Formulaire mesures
  const [measurements, setMeasurements] = useState({});
  const [editingMeasurements, setEditingMeasurements] = useState(false);

  const getStepStatus = (order, stepId) => {
    const stepOrder = productionSteps.find(s => s.id === stepId)?.order || 0;
    const currentStepOrder = productionSteps.find(s => s.id === order.currentStep)?.order || 0;
    
    const stepHistory = order.stepHistory.find(h => h.step === stepId);
    
    if (stepHistory?.completedAt) return 'completed';
    if (stepHistory?.startedAt) return 'inProgress';
    if (stepOrder < currentStepOrder) return 'completed';
    if (stepOrder === currentStepOrder) return 'inProgress';
    return 'pending';
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={20} color="#27AE60" />;
      case 'inProgress': return <Clock size={20} color="#F39C12" />;
      default: return <AlertCircle size={20} color="#BDC3C7" />;
    }
  };

  const handleUpdateStep = (order, newStep) => {
    const currentStepOrder = productionSteps.find(s => s.id === order.currentStep)?.order || 0;
    const newStepOrder = productionSteps.find(s => s.id === newStep)?.order || 0;
    
    if (newStepOrder < currentStepOrder) {
      Alert.alert('Erreur', 'Impossible de revenir en arrière');
      return;
    }
    
    Alert.alert(
      'Changer d\'étape',
      `Passer de "${productionSteps.find(s => s.id === order.currentStep)?.label}" à "${productionSteps.find(s => s.id === newStep)?.label}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            setOrders(prev =>
              prev.map(o => {
                if (o.id === order.id) {
                  const updatedHistory = [...o.stepHistory];
                  const existingStep = updatedHistory.find(h => h.step === newStep);
                  
                  if (!existingStep) {
                    updatedHistory.push({
                      step: newStep,
                      startedAt: new Date().toISOString(),
                      notes: '',
                    });
                  }
                  
                  return {
                    ...o,
                    currentStep: newStep,
                    stepHistory: updatedHistory,
                    updatedAt: new Date().toISOString(),
                  };
                }
                return o;
              })
            );
            Alert.alert('Succès', 'Étape mise à jour');
          },
        },
      ]
    );
  };

  const handleSaveMeasurements = () => {
    if (!selectedOrder) return;
    
    setOrders(prev =>
      prev.map(o => {
        if (o.id === selectedOrder.id) {
          const updatedHistory = [...o.stepHistory];
          const measurementStep = updatedHistory.find(h => h.step === 'measurement');
          
          if (!measurementStep?.completedAt) {
            updatedHistory.push({
              step: 'measurement',
              completedAt: new Date().toISOString(),
              notes: 'Mesures prises',
            });
          }
          
          return {
            ...o,
            measurements: { ...o.measurements, ...measurements },
            stepHistory: updatedHistory,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );
    
    setShowMeasurementsModal(false);
    Alert.alert('Succès', 'Mesures enregistrées avec succès');
  };

  const handleCreateOrder = () => {
    if (!orderForm.clientId || !orderForm.garmentType) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    const client = clients.find(c => c.id === orderForm.clientId);
    const garment = garmentTypes.find(g => g.id === orderForm.garmentType);
    
    const newOrder = {
      id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
      clientId: orderForm.clientId,
      clientName: client?.name || '',
      garmentType: orderForm.garmentType,
      garmentLabel: orderForm.garmentLabel || garment?.label || '',
      measurements: {},
      currentStep: 'measurement',
      stepHistory: [
        {
          step: 'measurement',
          startedAt: new Date().toISOString(),
          notes: '',
        },
      ],
      fabric: orderForm.fabric,
      fabricReference: orderForm.fabricReference,
      lining: orderForm.lining,
      buttons: orderForm.buttons,
      specialRequests: orderForm.specialRequests,
      price: orderForm.price,
      deposit: orderForm.deposit,
      remaining: orderForm.price - orderForm.deposit,
      estimatedDelivery: orderForm.estimatedDelivery.toISOString().split('T')[0],
      notes: orderForm.notes,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setOrders(prev => [...prev, newOrder]);
    setShowOrderModal(false);
    setOrderForm({
      clientId: '',
      garmentType: '',
      garmentLabel: '',
      fabric: '',
      fabricReference: '',
      lining: '',
      buttons: '',
      specialRequests: '',
      price: 0,
      deposit: 0,
      estimatedDelivery: new Date(),
      notes: '',
    });
    Alert.alert('Succès', 'Commande créée avec succès');
  };

  const filteredOrders = orders.filter(order =>
    order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.garmentLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderOrderCard = ({ item }) => {
    const currentStepInfo = productionSteps.find(s => s.id === item.currentStep);
    const progress = (productionSteps.findIndex(s => s.id === item.currentStep) + 1) / productionSteps.length * 100;
    
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => {
          setSelectedOrder(item);
          setMeasurements(item.measurements);
          setShowMeasurementsModal(true);
        }}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>{item.id}</Text>
            <Text style={styles.clientName}>{item.clientName}</Text>
          </View>
          <View style={styles.garmentBadge}>
            <Text style={styles.garmentBadgeText}>
              {garmentTypes.find(g => g.id === item.garmentType)?.icon} {item.garmentLabel}
            </Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Étape {productionSteps.findIndex(s => s.id === item.currentStep) + 1}/{productionSteps.length}
          </Text>
        </View>
        
        <View style={styles.currentStep}>
          <View style={[styles.stepIndicator, { backgroundColor: currentStepInfo?.color }]}>
            <Text style={styles.stepIndicatorText}>{currentStepInfo?.icon}</Text>
          </View>
          <View>
            <Text style={styles.stepLabel}>Étape actuelle</Text>
            <Text style={styles.stepName}>{currentStepInfo?.label}</Text>
          </View>
        </View>
        
        <View style={styles.orderFooter}>
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>Prix total</Text>
            <Text style={styles.priceValue}>{item.price} €</Text>
          </View>
          <View style={styles.deliveryInfo}>
            <Calendar size={14} color="#7F8C8D" />
            <Text style={styles.deliveryText}>
              Livraison estimée: {new Date(item.estimatedDelivery).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderProductionTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {filteredOrders.map((order) => {
        const currentStepOrder = productionSteps.findIndex(s => s.id === order.currentStep);
        
        return (
          <View key={order.id} style={styles.productionCard}>
            <View style={styles.productionHeader}>
              <View>
                <Text style={styles.productionOrderId}>{order.id}</Text>
                <Text style={styles.productionClient}>{order.clientName}</Text>
              </View>
              <View style={styles.productionGarment}>
                <Text style={styles.productionGarmentText}>
                  {garmentTypes.find(g => g.id === order.garmentType)?.icon} {order.garmentLabel}
                </Text>
              </View>
            </View>
            
            <View style={styles.stepsTimeline}>
              {productionSteps.map((step, index) => {
                const status = getStepStatus(order, step.id);
                const isCurrent = step.id === order.currentStep;
                
                return (
                  <View key={step.id} style={styles.timelineStep}>
                    <TouchableOpacity
                      style={[
                        styles.timelineNode,
                        status === 'completed' && styles.timelineNodeCompleted,
                        status === 'inProgress' && styles.timelineNodeInProgress,
                        isCurrent && { borderWidth: 2, borderColor: step.color },
                      ]}
                      onPress={() => handleUpdateStep(order, step.id)}
                      disabled={status === 'completed'}
                    >
                      <Text style={styles.timelineIcon}>{step.icon}</Text>
                    </TouchableOpacity>
                    {index < productionSteps.length - 1 && (
                      <View style={[
                        styles.timelineLine,
                        status === 'completed' && styles.timelineLineCompleted,
                      ]} />
                    )}
                    <Text style={[
                      styles.timelineLabel,
                      status === 'completed' && styles.timelineLabelCompleted,
                      isCurrent && { color: step.color, fontWeight: '600' },
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
            
            {order.stepHistory.length > 0 && (
              <View style={styles.stepHistory}>
                <Text style={styles.historyTitle}>Historique</Text>
                {order.stepHistory.map((history, idx) => {
                  const stepInfo = productionSteps.find(s => s.id === history.step);
                  return (
                    <View key={idx} style={styles.historyItem}>
                      <View style={[styles.historyDot, { backgroundColor: stepInfo?.color }]} />
                      <View style={styles.historyContent}>
                        <Text style={styles.historyStep}>{stepInfo?.label}</Text>
                        <Text style={styles.historyDate}>
                          {history.completedAt ? `Terminé le ${new Date(history.completedAt).toLocaleDateString('fr-FR')}` :
                           history.startedAt ? `Démarré le ${new Date(history.startedAt).toLocaleDateString('fr-FR')}` : ''}
                        </Text>
                        {history.notes && (
                          <Text style={styles.historyNotes}>{history.notes}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );

  const renderMeasurementsModal = () => (
    <Modal
      visible={showMeasurementsModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowMeasurementsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Prise de mesures</Text>
              {selectedOrder && (
                <Text style={styles.modalSubtitle}>
                  {selectedOrder.clientName} - {selectedOrder.garmentLabel}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setShowMeasurementsModal(false)}>
              <X size={24} color="#7F8C8D" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll}>
            {measurementCategories.map((category) => (
              <View key={category.id} style={styles.measurementCategory}>
                <Text style={styles.categoryTitle}>{category.label}</Text>
                {category.measurements.map((measure) => (
                  <View key={measure.id} style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>{measure.label}</Text>
                    <View style={styles.measurementInputContainer}>
                      <TextInput
                        style={styles.measurementInput}
                        placeholder="--"
                        keyboardType="numeric"
                        value={measurements[measure.id]?.toString() || ''}
                        onChangeText={(text) => {
                          setMeasurements(prev => ({
                            ...prev,
                            [measure.id]: text ? parseFloat(text) : '',
                          }));
                        }}
                      />
                      <Text style={styles.measurementUnit}>{measure.unit}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
            
            <View style={styles.measurementCategory}>
              <Text style={styles.categoryTitle}>Observations & Notes</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Notes particulières, corrections, etc."
                multiline
                numberOfLines={4}
                value={measurements.notes || ''}
                onChangeText={(text) => setMeasurements(prev => ({ ...prev, notes: text }))}
              />
            </View>
            
            <View style={styles.measurementCategory}>
              <Text style={styles.categoryTitle}>Photos de référence</Text>
              <TouchableOpacity style={styles.photoUploadButton}>
                <Camera size={24} color="#E67E22" />
                <Text style={styles.photoUploadText}>Ajouter des photos</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowMeasurementsModal(false)}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveMeasurements}>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderOrderModal = () => (
    <Modal
      visible={showOrderModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowOrderModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.modalContentLarge]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouvelle commande</Text>
            <TouchableOpacity onPress={() => setShowOrderModal(false)}>
              <X size={24} color="#7F8C8D" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Client *</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={clients}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.clientChip,
                      orderForm.clientId === item.id && styles.clientChipActive,
                    ]}
                    onPress={() => setOrderForm(prev => ({ ...prev, clientId: item.id }))}
                  >
                    <User size={14} color={orderForm.clientId === item.id ? '#FFFFFF' : '#7F8C8D'} />
                    <Text style={[
                      styles.clientChipText,
                      orderForm.clientId === item.id && styles.clientChipTextActive,
                    ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.addClientButton} onPress={() => setShowClientModal(true)}>
                <Plus size={16} color="#E67E22" />
                <Text style={styles.addClientText}>Nouveau client</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Type de vêtement *</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={garmentTypes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.garmentChip,
                      orderForm.garmentType === item.id && styles.garmentChipActive,
                    ]}
                    onPress={() => setOrderForm(prev => ({ ...prev, garmentType: item.id }))}
                  >
                    <Text style={styles.garmentChipIcon}>{item.icon}</Text>
                    <Text style={[
                      styles.garmentChipText,
                      orderForm.garmentType === item.id && styles.garmentChipTextActive,
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Désignation</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ex: Costume 3 pièces bleu marine"
                value={orderForm.garmentLabel}
                onChangeText={(text) => setOrderForm(prev => ({ ...prev, garmentLabel: text }))}
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.halfGroup]}>
                <Text style={styles.formLabel}>Prix total (€)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={orderForm.price.toString()}
                  onChangeText={(text) => setOrderForm(prev => ({ ...prev, price: parseFloat(text) || 0 }))}
                />
              </View>
              <View style={[styles.formGroup, styles.halfGroup]}>
                <Text style={styles.formLabel}>Acompte (€)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={orderForm.deposit.toString()}
                  onChangeText={(text) => setOrderForm(prev => ({ ...prev, deposit: parseFloat(text) || 0 }))}
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tissu principal</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ex: Laine bleu marine"
                value={orderForm.fabric}
                onChangeText={(text) => setOrderForm(prev => ({ ...prev, fabric: text }))}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Référence tissu</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Référence"
                value={orderForm.fabricReference}
                onChangeText={(text) => setOrderForm(prev => ({ ...prev, fabricReference: text }))}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Doublure</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Type de doublure"
                value={orderForm.lining}
                onChangeText={(text) => setOrderForm(prev => ({ ...prev, lining: text }))}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Boutons / Fermetures</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Détails des boutons"
                value={orderForm.buttons}
                onChangeText={(text) => setOrderForm(prev => ({ ...prev, buttons: text }))}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Demandes spéciales</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Poches intérieures, broderies, etc."
                multiline
                numberOfLines={3}
                value={orderForm.specialRequests}
                onChangeText={(text) => setOrderForm(prev => ({ ...prev, specialRequests: text }))}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date de livraison estimée</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  // Date picker implementation
                }}
              >
                <Calendar size={18} color="#E67E22" />
                <Text style={styles.dateInputText}>
                  {orderForm.estimatedDelivery.toLocaleDateString('fr-FR')}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes internes</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Notes pour le suivi"
                multiline
                numberOfLines={3}
                value={orderForm.notes}
                onChangeText={(text) => setOrderForm(prev => ({ ...prev, notes: text }))}
              />
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowOrderModal(false)}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleCreateOrder}>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Créer la commande</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header/>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Atelier de Couture</Text>
          <Text style={styles.subtitle}>Suivi des mesures & production</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowOrderModal(true)}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Briefcase size={20} color={activeTab === 'orders' ? '#E67E22' : '#7F8C8D'} />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Commandes ({orders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'production' && styles.tabActive]}
          onPress={() => setActiveTab('production')}
        >
          <Scissors size={20} color={activeTab === 'production' ? '#E67E22' : '#7F8C8D'} />
          <Text style={[styles.tabText, activeTab === 'production' && styles.tabTextActive]}>
            Suivi production
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#7F8C8D" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par client, commande, vêtement..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      {/* Content */}
      {activeTab === 'orders' ? (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucune commande trouvée</Text>
            </View>
          }
        />
      ) : (
        renderProductionTab()
      )}
      
      {/* Modals */}
      {renderMeasurementsModal()}
      {renderOrderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#E67E2210',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7F8C8D',
  },
  tabTextActive: {
    color: '#E67E22',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1A2C3E',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2C3E',
    marginTop: 2,
  },
  garmentBadge: {
    backgroundColor: '#FEF5E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  garmentBadgeText: {
    fontSize: 11,
    color: '#E67E22',
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#ECF0F1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E67E22',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 6,
  },
  currentStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ECF0F1',
  },
  stepIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorText: {
    fontSize: 20,
  },
  stepLabel: {
    fontSize: 10,
    color: '#95A5A6',
  },
  stepName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2C3E',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceLabel: {
    fontSize: 11,
    color: '#95A5A6',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E67E22',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryText: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  productionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  productionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  productionOrderId: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  productionClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2C3E',
    marginTop: 2,
  },
  productionGarment: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  productionGarmentText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  stepsTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  timelineNode: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ECF0F1',
    marginBottom: 8,
  },
  timelineNodeCompleted: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  timelineNodeInProgress: {
    backgroundColor: '#F39C12',
    borderColor: '#F39C12',
  },
  timelineIcon: {
    fontSize: 18,
  },
  timelineLine: {
    position: 'absolute',
    top: 22,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#ECF0F1',
    zIndex: -1,
  },
  timelineLineCompleted: {
    backgroundColor: '#27AE60',
  },
  timelineLabel: {
    fontSize: 10,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  timelineLabelCompleted: {
    color: '#27AE60',
  },
  stepHistory: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyStep: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A2C3E',
  },
  historyDate: {
    fontSize: 11,
    color: '#95A5A6',
    marginTop: 2,
  },
  historyNotes: {
    fontSize: 11,
    color: '#7F8C8D',
    marginTop: 4,
  },
  // Modal Styles
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
  },
  modalContentLarge: {
    maxHeight: screenHeight * 0.95,
  },
  modalScroll: {
    maxHeight: screenHeight * 0.7,
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
  modalSubtitle: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 12,
  },
  // Form Styles
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
    borderColor: '#ECF0F1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A2C3E',
    backgroundColor: '#FFFFFF',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECF0F1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateInputText: {
    fontSize: 14,
    color: '#1A2C3E',
  },
  clientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    gap: 6,
  },
  clientChipActive: {
    backgroundColor: '#E67E22',
    borderColor: '#E67E22',
  },
  clientChipText: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  clientChipTextActive: {
    color: '#FFFFFF',
  },
  addClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addClientText: {
    fontSize: 12,
    color: '#E67E22',
  },
  garmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    gap: 6,
  },
  garmentChipActive: {
    backgroundColor: '#E67E22',
    borderColor: '#E67E22',
  },
  garmentChipIcon: {
    fontSize: 14,
  },
  garmentChipText: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  garmentChipTextActive: {
    color: '#FFFFFF',
  },
  measurementCategory: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2C3E',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#E67E22',
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  measurementLabel: {
    fontSize: 14,
    color: '#2C3E50',
  },
  measurementInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  measurementInput: {
    width: 70,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  measurementUnit: {
    fontSize: 12,
    color: '#7F8C8D',
    width: 30,
  },
  photoUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    borderStyle: 'dashed',
  },
  photoUploadText: {
    fontSize: 14,
    color: '#E67E22',
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#95A5A6',
  },
});

export default TailoringMeasurementsScreen;