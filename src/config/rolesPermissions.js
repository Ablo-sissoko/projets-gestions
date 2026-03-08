/**
 * Permissions par rôle.
 * ADMIN a accès à tous les écrans.
 * Utiliser getPermissionsForRole(user) pour normaliser roleName (ex: "Commercial" -> COMMERCIAL).
 */
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
    'ProformaDevis',
    'Fournisseurs',
    'Categories',
    'VentesEmployees',
    'Clients',
    'Parametres',
    'Profile',
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
