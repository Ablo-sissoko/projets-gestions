// DashboardSalon.js - Gestion des services uniquement
import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Image,
  Switch,
  Platform,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import {
  Scissors,
  Edit2,
  Trash2,
  Plus,
  X,
  Clock,
  Tag,
  Award,
  Save,
  Upload,
  Power,
  AlertCircle,
  CheckCircle,
  Package,
  ChevronDown,
  ChevronUp,
  Star,
  Palette,
  Sparkles,
  Wind,
  Brush,
} from 'lucide-react-native';
import Header from '../../componants/Header';

const COLORS = {
  primary: '#E67E22',
  primaryLight: '#FEF5E8',
  primaryDark: '#C54E1E',
  success: '#10B981',
  successLight: '#E6F7F0',
  danger: '#EF4444',
  dangerLight: '#FEE9E7',
  warning: '#F59E0B',
  warningLight: '#FEF3E2',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
  muted: '#94A3B8',
  border: '#E2E8F0',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.5)',
};

const categories = [
  { id: 'coupe', label: 'Coupe', Icon: Scissors },
  { id: 'coloration', label: 'Coloration', Icon: Palette },
  { id: 'soin', label: 'Soin', Icon: Sparkles },
  { id: 'coiffage', label: 'Coiffage', Icon: Wind },
  { id: 'barbe', label: 'Barbe', Icon: Brush },
  { id: 'forfait', label: 'Forfait', Icon: Package },
  
];

// Données simulées
const mockServices = [
  {
    id: '1',
    name: 'Coupe Homme',
    description: 'Coupe classique ou tendance avec shampoing',
    duration: 30,
    price: 35,
    promotionalPrice: null,
    category: 'coupe',
    status: 'active',
    commission: 50,
    createdAt: new Date(2024, 0, 1),
    image: null,
  },
  {
    id: '2',
    name: 'Coupe Femme',
    description: 'Coupe sur mesure avec shampoing et coiffage',
    duration: 45,
    price: 45,
    promotionalPrice: null,
    category: 'coupe',
    status: 'active',
    commission: 50,
    createdAt: new Date(2024, 0, 1),
    image: null,
  },
  {
    id: '3',
    name: 'Coloration',
    description: 'Coloration complète ou racines',
    duration: 90,
    price: 80,
    promotionalPrice: 70,
    category: 'coloration',
    status: 'active',
    commission: 45,
    createdAt: new Date(2024, 0, 1),
    image: null,
  },
  {
    id: '4',
    name: 'Brushing',
    description: 'Brushing professionnel',
    duration: 30,
    price: 25,
    promotionalPrice: null,
    category: 'coiffage',
    status: 'active',
    commission: 40,
    createdAt: new Date(2024, 0, 1),
    image: null,
  },
  {
    id: '5',
    name: 'Lissage Brésilien',
    description: 'Lissage sans ammoniaque',
    duration: 120,
    price: 120,
    promotionalPrice: null,
    category: 'soin',
    status: 'inactive',
    commission: 55,
    createdAt: new Date(2024, 0, 1),
    image: null,
  },
];

const DashboardSalon = () => {
  const [services, setServices] = useState(mockServices);
  const [editingService, setEditingService] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const serviceSheetRef = useRef(null);
  const sheetSnapPoints = useMemo(() => ['92%'], []);
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

  // Formulaire Service
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    promotionalPrice: '',
    category: '',
    commission: 50,
    status: 'active',
    image: null,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simuler un rechargement
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return COLORS.success;
      case 'inactive':
        return COLORS.muted;
      default:
        return COLORS.muted;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={12} color={COLORS.success} />;
      case 'inactive':
        return <AlertCircle size={12} color={COLORS.muted} />;
      default:
        return null;
    }
  };

  const getCategoryLabel = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.label : categoryId;
  };

  const renderCategoryIcon = (categoryId, size = 22, color = COLORS.primary) => {
    const cat = categories.find((c) => c.id === categoryId);
    const IconComponent = cat?.Icon ?? Package;
    return <IconComponent size={size} color={color} />;
  };

  const toggleExpand = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleServiceStatus = (service) => {
    const newStatus = service.status === 'active' ? 'inactive' : 'active';
    setServices(prev =>
      prev.map(s => s.id === service.id ? { ...s, status: newStatus } : s)
    );
    Alert.alert('Succès', `Service ${newStatus === 'active' ? 'activé' : 'désactivé'} avec succès`);
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      duration: 30,
      price: 0,
      promotionalPrice: '',
      category: '',
      commission: 50,
      status: 'active',
      image: null,
    });
  };

  const closeServiceSheet = () => {
    serviceSheetRef.current?.close();
    setEditingService(null);
    resetServiceForm();
  };

  const openAddService = () => {
    setEditingService(null);
    resetServiceForm();
    serviceSheetRef.current?.expand();
  };

  const handleDeleteService = (service) => {
    Alert.alert(
      'Supprimer le service',
      `Voulez-vous vraiment supprimer le service "${service.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: () => {
            setServices(prev => prev.filter(s => s.id !== service.id));
            Alert.alert('Succès', 'Service supprimé avec succès');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSaveService = () => {
    if (!serviceForm.name || !serviceForm.price || !serviceForm.category) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (editingService && (!serviceForm.duration || serviceForm.duration <= 0)) {
      Alert.alert('Erreur', 'Indiquez une durée valide');
      return;
    }

    const isCreate = !editingService;
    const newService = {
      id: editingService?.id || Date.now().toString(),
      name: serviceForm.name,
      description: serviceForm.description,
      duration: isCreate ? (serviceForm.duration || 30) : serviceForm.duration,
      price: serviceForm.price,
      promotionalPrice: serviceForm.promotionalPrice ? parseFloat(serviceForm.promotionalPrice) : null,
      category: serviceForm.category,
      status: isCreate ? 'active' : serviceForm.status,
      commission: isCreate ? 50 : serviceForm.commission,
      createdAt: new Date(),
      image: serviceForm.image,
    };

    if (editingService) {
      setServices(prev => prev.map(s => s.id === editingService.id ? newService : s));
      Alert.alert('Succès', 'Service modifié avec succès');
    } else {
      setServices(prev => [...prev, newService]);
      Alert.alert('Succès', 'Service ajouté avec succès');
    }

    closeServiceSheet();
  };

  const editService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
      promotionalPrice: service.promotionalPrice?.toString() || '',
      category: service.category,
      commission: service.commission,
      status: service.status,
      image: service.image,
    });
    serviceSheetRef.current?.expand();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setServiceForm(prev => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const getStockStatus = (price, promoPrice) => {
    if (promoPrice && promoPrice < price) {
      return { color: COLORS.success, label: "Promotion", bg: COLORS.successLight };
    }
    return { color: COLORS.text, label: "Prix normal", bg: "#F8FAFC" };
  };

  const renderStars = (rating = 4.5) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            color={star <= rating ? '#F59E0B' : '#E2E8F0'}
            fill={star <= rating ? '#F59E0B' : 'transparent'}
          />
        ))}
      </View>
    );
  };

  const renderServiceCard = ({ item }) => {
    const isExpanded = expandedCards[item.id];
    const stockStatus = getStockStatus(item.price, item.promotionalPrice);
    const hasPromo = item.promotionalPrice && item.promotionalPrice < item.price;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconContainer, { backgroundColor: COLORS.primaryLight }]}>
              {renderCategoryIcon(item.category)}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <View style={styles.priceContainer}>
                {hasPromo ? (
                  <>
                    <Text style={styles.originalPrice}>{item.price}€</Text>
                    <Text style={styles.promoPrice}>{item.promotionalPrice}€</Text>
                  </>
                ) : (
                  <Text style={styles.priceValue}>{item.price}€</Text>
                )}
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
                  {getStatusIcon(item.status)}
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {getStatusText(item.status)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.cardHeaderRight}>
            <View style={[styles.stockBadge, { backgroundColor: stockStatus.bg }]}>
              <Text style={[styles.stockText, { color: stockStatus.color }]}>
                {stockStatus.label}
              </Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={20} color={COLORS.textLight} />
            ) : (
              <ChevronDown size={20} color={COLORS.textLight} />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.cardBody}>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Clock size={14} color={COLORS.textLight} />
                <Text style={styles.detailText}>{item.duration} min</Text>
              </View>
              <View style={styles.detailItem}>
                <Tag size={14} color={COLORS.textLight} />
                <Text style={styles.detailText}>{getCategoryLabel(item.category)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Award size={14} color={COLORS.textLight} />
                <Text style={styles.detailText}>Commission: {item.commission}%</Text>
              </View>
              <View style={styles.detailItem}>
                {renderStars()}
                <Text style={styles.ratingText}>4.5 (128 avis)</Text>
              </View>
            </View>

            {item.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.descriptionText}>{item.description}</Text>
              </View>
            )}

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: COLORS.primaryLight }]}
                onPress={() => editService(item)}
              >
                <Edit2 size={16} color={COLORS.primary} />
                <Text style={[styles.actionText, { color: COLORS.primary }]}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: item.status === 'active' ? COLORS.dangerLight : COLORS.successLight }]}
                onPress={() => handleToggleServiceStatus(item)}
              >
                <Power size={16} color={item.status === 'active' ? COLORS.danger : COLORS.success} />
                <Text style={[styles.actionText, { color: item.status === 'active' ? COLORS.danger : COLORS.success }]}>
                  {item.status === 'active' ? 'Désactiver' : 'Activer'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: COLORS.dangerLight }]}
                onPress={() => handleDeleteService(item)}
              >
                <Trash2 size={16} color={COLORS.danger} />
                <Text style={[styles.actionText, { color: COLORS.danger }]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderServiceBottomSheet = () => (
    <BottomSheet
      ref={serviceSheetRef}
      index={-1}
      snapPoints={sheetSnapPoints}
      enablePanDownToClose
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderSheetBackdrop}
    >
      <BottomSheetFlatList
        data={[]}
        keyExtractor={(_, index) => String(index)}
        keyboardShouldPersistTaps="handled"
        renderItem={() => null}
        contentContainerStyle={styles.sheetListContent}
        ListHeaderComponent={
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Modifier le service' : 'Ajouter un service'}
              </Text>
              <TouchableOpacity onPress={closeServiceSheet} hitSlop={12}>
                <X size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {serviceForm.image ? (
                <Image source={{ uri: serviceForm.image }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Upload size={32} color={COLORS.primary} />
                  <Text style={styles.imageUploadText}>Ajouter une image</Text>
                  <Text style={styles.imageUploadSubtext}>JPG, PNG max 5MB</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nom du service *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ex: Coupe Homme"
                placeholderTextColor={COLORS.muted}
                value={serviceForm.name}
                onChangeText={(text) => setServiceForm(prev => ({ ...prev, name: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Description détaillée du service..."
                placeholderTextColor={COLORS.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={serviceForm.description}
                onChangeText={(text) => setServiceForm(prev => ({ ...prev, description: text }))}
              />
            </View>

            {editingService ? (
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.halfGroup]}>
                  <Text style={styles.formLabel}>Durée (minutes) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="30"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="numeric"
                    value={serviceForm.duration.toString()}
                    onChangeText={(text) => setServiceForm(prev => ({ ...prev, duration: parseInt(text, 10) || 0 }))}
                  />
                </View>
                <View style={[styles.formGroup, styles.halfGroup]}>
                  <Text style={styles.formLabel}>Prix (€) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="35"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="numeric"
                    value={serviceForm.price.toString()}
                    onChangeText={(text) => setServiceForm(prev => ({ ...prev, price: parseFloat(text) || 0 }))}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Prix (€) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="35"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="numeric"
                  value={serviceForm.price.toString()}
                  onChangeText={(text) => setServiceForm(prev => ({ ...prev, price: parseFloat(text) || 0 }))}
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Prix promotionnel (optionnel)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="30"
                placeholderTextColor={COLORS.muted}
                keyboardType="numeric"
                value={serviceForm.promotionalPrice}
                onChangeText={(text) => setServiceForm(prev => ({ ...prev, promotionalPrice: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Catégorie *</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const CatIcon = item.Icon;
                  const active = serviceForm.category === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                      onPress={() => setServiceForm(prev => ({ ...prev, category: item.id }))}
                    >
                      <CatIcon size={16} color={active ? COLORS.white : COLORS.primary} />
                      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            {editingService ? (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Commission coiffeur (%) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="50"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="numeric"
                    value={serviceForm.commission.toString()}
                    onChangeText={(text) => setServiceForm(prev => ({ ...prev, commission: parseInt(text, 10) || 0 }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Statut</Text>
                  <View style={styles.statusSwitch}>
                    <Text style={styles.statusSwitchLabel}>Service actif</Text>
                    <Switch
                      value={serviceForm.status === 'active'}
                      onValueChange={(value) => setServiceForm(prev => ({ ...prev, status: value ? 'active' : 'inactive' }))}
                      trackColor={{ false: COLORS.border, true: COLORS.primary }}
                      thumbColor={COLORS.white}
                    />
                  </View>
                </View>
              </>
            ) : null}
          </>
        }
        ListFooterComponent={
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={closeServiceSheet}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveService}>
              <Save size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </BottomSheet>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <Header />

      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Gestion des services</Text>
            <Text style={styles.headerSubtitle}>
              {services.length} service(s)
            </Text>
          </View>
        </View>

        <FlatList
          data={services}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderServiceCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={64} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>Aucun service trouvé</Text>
              <Text style={styles.emptyText}>
                Ajoutez votre premier service
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={openAddService}
              >
                <Plus size={20} color={COLORS.white} />
                <Text style={styles.emptyButtonText}>Ajouter un service</Text>
              </TouchableOpacity>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={openAddService}
          activeOpacity={0.9}
          accessibilityLabel="Ajouter un service"
        >
          <Plus size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {renderServiceBottomSheet()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    position: 'relative',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 28 : 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
    color: COLORS.muted,
  },
  promoPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.danger,
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
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
    gap: 14,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  descriptionContainer: {
    backgroundColor: COLORS.bg,
    padding: 12,
    borderRadius: 12,
  },
  descriptionLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sheetListContent: {
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
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
    fontWeight: '700',
    color: COLORS.text,
  },
  imageUpload: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  uploadedImage: {
    width: '100%',
    height: 150,
    borderRadius: 16,
  },
  imageUploadText: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 12,
    fontWeight: '500',
  },
  imageUploadSubtext: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
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
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  statusSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statusSwitchLabel: {
    fontSize: 15,
    color: COLORS.text,
  },
  modalFooter: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default DashboardSalon;