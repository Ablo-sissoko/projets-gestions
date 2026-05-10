/**
 * Permissions par rôle.
 * ADMIN a accès à tous les écrans.
 * Utiliser getPermissionsForRole(user) pour normaliser roleName (ex: "Commercial" -> COMMERCIAL).
 */
import {
  getEntrepriseConfig,
  getUserCategoryId,
  RESTAURANT_CUSTOM_SCREENS,
  SALON_CUSTOM_SCREENS,
  TRANSFERT_CUSTOM_SCREENS,
  PRESTATION_CUSTOM_SCREENS,
} from './entrepriseConfig'

/** Routes des modules métier (drawer) — ajoutées pour le rôle ADMIN de base. */
export const ALL_CUSTOM_SCREEN_ROUTE_NAMES = [
  ...RESTAURANT_CUSTOM_SCREENS,
  ...SALON_CUSTOM_SCREENS,
  ...TRANSFERT_CUSTOM_SCREENS,
  ...PRESTATION_CUSTOM_SCREENS,
].map((s) => s.routeName)

export const ROLE_PERMISSIONS = {
  ADMIN: [
    'Dashboard',
    'Ventes',
    'Depenses',
    'Transferts',
    'Comptes',
    'Revenus',
    'Rapports',
    'Produits',
    'ProduitQuantite',
    'Commandes',
    'BordereauLivraison',
    'ProformaDevis',
    'Fournisseurs',
    'Categories',
    'VentesEmployees',
    'Clients',
    'Parametres',
    'Profile',
    ...ALL_CUSTOM_SCREEN_ROUTE_NAMES,
  ],

  // COMMERCIAL : pas d'accès à Rapports, Revenus, Comptes, Dépenses, Transferts
  COMMERCIAL: [
    'Dashboard',
    'Commandes',
    'Fournisseurs',
    'Clients',
    'Categories',
    'Ventes',
    'Produits',
    'Profile',
    'ProduitQuantite',
    'Commandes',
    'BordereauLivraison',
    'ProformaDevis',
    'Fournisseurs',
    'Categories',
    'VentesEmployees',
    'Clients',
  ],

  COMPTABILITE: [
    'Dashboard',
    'Rapports',
    'Revenus',
    'Comptes',
    'Depenses',
    'Transferts',
    'Profile',
    'Categories',
  ],
}

function normalizeRoleName(roleName) {
  return (roleName || '').toString().replace(/\s+/g, ' ').trim().toUpperCase()
}

/** Retourne les permissions pour un user. COMMERCIAL ne voit jamais Rapports, Revenus, Comptes, Dépenses, Transferts. */
export function getPermissionsForRole(user) {
  const role = normalizeRoleName(user?.roleName)
  if (role === 'COMMERCIAL') return ROLE_PERMISSIONS.COMMERCIAL
  if (role === 'COMPTABILITE') return ROLE_PERMISSIONS.COMPTABILITE
  if (role === 'ADMIN') return ROLE_PERMISSIONS.ADMIN
  return ROLE_PERMISSIONS.ADMIN
}

/**
 * Permissions effectives : intersection rôle × écrans autorisés par la catégorie entreprise.
 * Les écrans custom du module courant sont ajoutés pour ADMIN uniquement.
 */
export function getEffectivePermissions(user) {
  const base = new Set(getPermissionsForRole(user))
  const categoryId = getUserCategoryId(user)
  const config = getEntrepriseConfig(categoryId)
  const visible = new Set(config.screens.visible)

  if (normalizeRoleName(user?.roleName) === 'ADMIN') {
    config.customScreens.forEach((s) => base.add(s.routeName))
  }

  return [...base].filter((p) => visible.has(p))
}
