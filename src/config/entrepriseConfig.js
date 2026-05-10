// config/entrepriseConfig.js
// Mapping catégories entreprise (API) ↔ écrans racine vs modules métier (sous-dossiers screens/).

/** Écrans présents dans `src/screens/*.js` (hors sous-dossiers métier) — utilisés pour la catégorie Boutique / magasin. */
export const ROOT_SCREEN_NAMES = [
  'Dashboard',
  'Ventes',
  'Produits',
  'Clients',
  'Depenses',
  'Transferts',
  'Comptes',
  'Rapports',
  'Revenus',
  'Commandes',
  'BordereauLivraison',
  'ProformaDevis',
  'ProduitQuantite',
  'Fournisseurs',
  'Categories',
  'VentesEmployees',
  'Parametres',
  'Profile',
]

/** Écrans communs à toutes les catégories métiers (tiroir / onglets selon permissions). */
export const COMMON_SCREEN_NAMES = ['Depenses', 'Parametres', 'Profile', 'Rapports', 'Comptes']

/** id → slug API (référence) */
export const CATEGORY_SLUG_BY_ID = {
  1: 'boutique-quincaillerie-super-marche-magasin-etc…',
  2: 'restaurant-patisserie-boulangerie…',
  3: 'salon-de-coiffure-ateliers',
  4: 'transfert-d-argent',
  5: 'prestation-de-service',
}

/** Module Restaurant / pâtisserie / boulangerie — `src/screens/Boulangeries/` */
export const RESTAURANT_CUSTOM_SCREENS = [
  { routeName: 'DashboardBoulangerie', label: 'Tableau de bord', path: 'screens/Boulangeries/DashboardBoulangerie.js' },
  { routeName: 'ProductionLabo', label: 'Production & labo', path: 'screens/Boulangeries/ProductionLabo.js' },
  { routeName: 'StocksAchats', label: 'Stocks & achats', path: 'screens/Boulangeries/StocksAchats.js' },
  { routeName: 'VenteEncaissement', label: 'Vente & encaissement', path: 'screens/Boulangeries/VenteEncaissement.js' },
  { routeName: 'RessourcesHumaines', label: 'Ressources humaines', path: 'screens/Boulangeries/RessourcesHumaines.js' },
  { routeName: 'AnalyseFinanciere', label: 'Analyse financière', path: 'screens/Boulangeries/AnalyseFinanciere.js' },
]

/** Salon de coiffure / ateliers — `src/screens/SalonCoiffure/` */
export const SALON_CUSTOM_SCREENS = [
  {
    routeName: 'Accueil',
    label: 'Tableau de bord',
    path: 'screens/SalonCoiffure/DashboardSalon.js',
    isTab: true,
    icon: 'BarChart3',
  },
  { routeName: 'CoiffeursEtServices', label: 'Services', path: 'screens/SalonCoiffure/CoiffeursEtServices.js', icon: 'users' },
  { routeName: 'RendezVous', label: 'Rendez-vous', path: 'screens/SalonCoiffure/RendezVous.js', icon: 'calendar' },

]

/** Transfert d'argent — `src/screens/TransfertsArgents/` (dossier sans espace) */
export const TRANSFERT_CUSTOM_SCREENS = [
  { routeName: 'DashboardTransferts', label: 'Liquidité totale', path: 'screens/TransfertsArgents/DashboardTransferts.js' },
  { routeName: 'OperationsTransferts', label: 'Opérations', path: 'screens/TransfertsArgents/OperationsTransferts.js' },
  { routeName: 'ApprovisionnementTransferts', label: 'Approvisionnement', path: 'screens/TransfertsArgents/ApprovisionnementTransferts.js' },
  { routeName: 'JournalCaisseTransferts', label: 'Journal & rapprochement', path: 'screens/TransfertsArgents/JournalCaisseTransferts.js' },
  { routeName: 'SecuriteTransferts', label: 'Sécurité & contrôle', path: 'screens/TransfertsArgents/SecuriteTransferts.js' },
  { routeName: 'ComptesUvTransferts', label: 'UV perso / business', path: 'screens/TransfertsArgents/ComptesUvTransferts.js' },
]

/** Prestation de services — `src/screens/PrestationServices/` */
export const PRESTATION_CUSTOM_SCREENS = [
  { routeName: 'DashboardPrestations', label: 'KPI & pipeline', path: 'screens/PrestationServices/DashboardPrestations.js' },
  { routeName: 'CrmDevisPrestations', label: 'CRM & devis', path: 'screens/PrestationServices/CrmDevisPrestations.js' },
  { routeName: 'PlanificationExecutionPrestations', label: 'Planification', path: 'screens/PrestationServices/PlanificationExecutionPrestations.js' },
  { routeName: 'SuiviInterventionsPrestations', label: 'Interventions terrain', path: 'screens/PrestationServices/SuiviInterventionsPrestations.js' },
  { routeName: 'FacturationFinancesPrestations', label: 'Facturation', path: 'screens/PrestationServices/FacturationFinancesPrestations.js' },
  { routeName: 'EspaceCollaborateursPrestations', label: 'Collaborateurs', path: 'screens/PrestationServices/EspaceCollaborateursPrestations.js' },
]

function mergeVisible(commonRoutes, customRouteNames, ...extraLists) {
  const set = new Set([...commonRoutes, ...customRouteNames])
  extraLists.forEach((list) => {
    ;(list || []).forEach((x) => set.add(x))
  })
  return Array.from(set)
}

function hiddenRootExcept(visibleSet) {
  return ROOT_SCREEN_NAMES.filter((name) => !visibleSet.has(name))
}

/**
 * Catégorie entreprise depuis le profil API (login `/sellprox/login`).
 * Priorité : `categoryIdBoutique` (réponse API) puis alias `category_id` normalisé à la connexion.
 */
export function getUserCategoryId(user) {
  if (!user) return '1'
  const v =
    user.categoryIdBoutique ??
    user.category_id ??
    user.categoryId ??
    user.entreprise?.category_id ??
    user.entreprise_category_id
  if (v === null || v === undefined || v === '') return '1'
  return String(v).trim() || '1'
}

/** Libellé affichable : `categoryBoutique` (API) sinon nom dérivé de `getEntrepriseConfig`. */
export function getCategoryDisplayName(user) {
  if (!user) return getEntrepriseConfig('1').name
  const label = typeof user.categoryBoutique === 'string' ? user.categoryBoutique.trim() : ''
  if (label) return label
  return getEntrepriseConfig(getUserCategoryId(user)).name
}

/**
 * Ordre des onglets du bas : cat. 1 = POS classique ; sinon 1er écran métier + onglets racine utiles.
 */
export function getBottomTabRouteOrder(categoryId) {
  const config = getEntrepriseConfig(categoryId)
  if (config.type === 'FULL_POS') {
    return ['Dashboard', 'Clients', 'Ventes', 'Produits', 'Profile']
  }
  const first = config.customScreens[0]
  const head = first?.routeName ? [first.routeName] : []
  const tail = ['Clients', 'Ventes', 'Produits', 'Profile'].filter(
    (r) => config.screens.visible.includes(r)
  )
  return [...head, ...tail.filter((t) => !head.includes(t))]
}

export function getEntrepriseConfig(categoryId) {
  const id = String(categoryId || '1')
  const slug = CATEGORY_SLUG_BY_ID[id] || CATEGORY_SLUG_BY_ID[1]

  switch (id) {
    case '1': {
      // Boutique, quincaillerie, super marché, magasin — tout le flux POS racine
      const visible = [...ROOT_SCREEN_NAMES]
        return {
          type: 'FULL_POS',
        categoryId: id,
        slug,
          name: 'Boutique / Super marché',
          allowProducts: true,
          allowServices: true,
          hasStock: true,
          hasPurchasePrice: true,
          forceMode: null,
          screens: {
          visible,
          hidden: [],
        },
        customScreens: [],
      }
    }

    case '2': {
      // Restaurant, pâtisserie, boulangerie — modules Boulangeries + écrans communs + accès caisse / catalogue
      const customNames = RESTAURANT_CUSTOM_SCREENS.map((s) => s.routeName)
      const visible = mergeVisible(COMMON_SCREEN_NAMES, customNames, [
        'Clients',
        'Ventes',
        'Produits',
        'BordereauLivraison',
      ])
      const visibleSet = new Set(visible)
        return {
          type: 'RESTAURANT',
        categoryId: id,
        slug,
          name: 'Restaurant',
          allowProducts: true,
          allowServices: false,
          hasStock: true,
          hasPurchasePrice: true,
          forceMode: null,
          screens: {
          visible,
          hidden: hiddenRootExcept(visibleSet),
        },
        customScreens: RESTAURANT_CUSTOM_SCREENS,
      }
    }

    case '3': {
      // Salon de coiffure, ateliers — modules SalonCoiffure + communs + vente / clients
      const customNames = SALON_CUSTOM_SCREENS.map((s) => s.routeName)
      const visible = mergeVisible(COMMON_SCREEN_NAMES, customNames, [
        'Clients',
        'Ventes',
        'Produits',
        'Categories',
        'BordereauLivraison',
      ])
      const visibleSet = new Set(visible)
        return {
        type: 'SALON_ATELIER',
        categoryId: id,
        slug,
          name: 'Salon / Atelier',
          allowProducts: false,
          allowServices: true,
          hasStock: false,
          hasPurchasePrice: false,
          forceMode: 'service',
          screens: {
          visible,
          hidden: hiddenRootExcept(visibleSet),
        },
        customScreens: SALON_CUSTOM_SCREENS,
      }
    }

    case '4': {
      // Transfert d'argent — modules TransfertsArgents + communs + fiche client
      const customNames = TRANSFERT_CUSTOM_SCREENS.map((s) => s.routeName)
      const visible = mergeVisible(COMMON_SCREEN_NAMES, customNames, [
        'Clients',
        'BordereauLivraison',
      ])
      const visibleSet = new Set(visible)
        return {
          type: 'TRANSFER',
        categoryId: id,
        slug,
        name: "Transfert d'argent",
          allowProducts: false,
          allowServices: true,
          hasStock: false,
          hasPurchasePrice: false,
          forceMode: 'service',
          screens: {
          visible,
          hidden: hiddenRootExcept(visibleSet),
        },
        customScreens: TRANSFERT_CUSTOM_SCREENS,
      }
    }

    case '5': {
      // Prestation de service — modules PrestationServices + communs + clients / vente
      const customNames = PRESTATION_CUSTOM_SCREENS.map((s) => s.routeName)
      const visible = mergeVisible(COMMON_SCREEN_NAMES, customNames, [
        'Clients',
        'Ventes',
        'BordereauLivraison',
      ])
      const visibleSet = new Set(visible)
        return {
        type: 'PRESTATION',
        categoryId: id,
        slug,
        name: 'Prestation de service',
        allowProducts: false,
          allowServices: true,
        hasStock: false,
        hasPurchasePrice: false,
        forceMode: 'service',
          screens: {
          visible,
          hidden: hiddenRootExcept(visibleSet),
        },
        customScreens: PRESTATION_CUSTOM_SCREENS,
      }
    }

    default:
      return getEntrepriseConfig('1')
  }
}

export function getEntrepriseConfigBySlug(slug) {
  const entry = Object.entries(CATEGORY_SLUG_BY_ID).find(([, s]) => s === slug)
  return getEntrepriseConfig(entry ? entry[0] : '1')
}

/** Catégories orientées services (pas de stock produit classique). */
  export function isServiceOnlyEntreprise(categoryId) {
  return ['3', '4', '5'].includes(String(categoryId))
  }
  
  export function hasStockManagement(categoryId) {
    return ['1', '2'].includes(String(categoryId))
  }
  
  export function hasPurchasePrice(categoryId) {
    return ['1', '2'].includes(String(categoryId))
  }
  
  /**
 * Filtre les écrans autorisés pour la catégorie × permissions utilisateur.
 * @param {string|number} categoryId
 * @param {string[]} userPermissions
   */
  export function getVisibleScreens(categoryId, userPermissions = []) {
    const config = getEntrepriseConfig(categoryId)
  const allowed = new Set(config.screens.visible)
  return config.screens.visible.filter(
    (screen) => allowed.has(screen) && userPermissions.includes(screen)
  )
}

/** Noms de routes des écrans custom uniquement (pour enregistrement Drawer). */
export function getCustomScreenRouteNames(categoryId) {
  return getEntrepriseConfig(categoryId).customScreens.map((s) => s.routeName)
}
