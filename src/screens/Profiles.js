import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { User, Shield, Edit, Lock, Calendar } from 'lucide-react-native'
import Header from '../componants/Header'
import { Modalize } from 'react-native-modalize'
import * as SecureStore from 'expo-secure-store'
import { AuthContext } from '../context/AuthContext'
import api from '../api/Axios'
import DateTimePicker from '@react-native-community/datetimepicker'
import COLORS from '../constants/couleurs'

function formatDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return ''
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

function parseDate(str) {
  if (!str || typeof str !== 'string') return null
  const trimmed = str.trim()
  if (!trimmed) return null
  const parts = trimmed.split(/[/\-.]/)
  if (parts.length === 3) {
    const a = parseInt(parts[0], 10)
    const b = parseInt(parts[1], 10) - 1
    const c = parseInt(parts[2], 10)
    if (isNaN(a) || isNaN(b) || isNaN(c)) return null
    let day, month, year
    if (a > 31) {
      year = a
      month = b
      day = c
    } else {
      day = a
      month = b
      year = c
    }
    const date = new Date(year, month, day)
    if (!isNaN(date.getTime())) return date
  }
  const parsed = Date.parse(trimmed)
  if (!isNaN(parsed)) return new Date(parsed)
  return null
}

/** Affiche la date de naissance au format JJ/MM/AAAA (gère API YYYY-MM-DD ou déjà dd/mm/yyyy) */
function formatDobForDisplay(dob) {
  if (!dob || typeof dob !== 'string') return '-'
  const d = parseDate(dob)
  return d ? formatDate(d) : dob.trim() || '-'
}

/** Convertit la date en YYYY-MM-DD pour l'API */
function dobToApiFormat(dob) {
  const d = parseDate(dob)
  if (!d || isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function ProfileScreen() {
  const { user: contextUser, setUser } = useContext(AuthContext)
  const [userInfo, setUserInfo] = useState(null)
  const [profileInfo, setProfileInfo] = useState({
    phone: '',
    email: '',
    address: '',
    city: '',
    dob: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [infoLoading, setInfoLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showDobPicker, setShowDobPicker] = useState(false)
  const [dobDate, setDobDate] = useState(() => new Date(2000, 0, 1))
  const infoSheetRef = useRef(null)
  const securitySheetRef = useRef(null)

  const syncUserFromContext = useCallback(() => {
    const u = contextUser
    if (!u) return
    setUserInfo(u)
    setProfileInfo({
      phone: u?.telephoneBoutique || u?.telephone || u?.phone || '',
      email: u?.email || '',
      address: u?.adresseBoutique || u?.adresse || u?.address || '',
      city: u?.ville || u?.city || '',
      dob: u?.dateNaissance || u?.dob || '',
      status: u?.status || '',
      profession: u?.profession || '',
    })
  }, [contextUser])

  useEffect(() => {
    syncUserFromContext()
  }, [syncUserFromContext])

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    syncUserFromContext()
    setRefreshing(false)
  }, [syncUserFromContext])

  const saveInfo = async () => {
    const user = contextUser
    const userId = user?.id
    if (!userId) {
      Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.')
      return
    }

    setInfoLoading(true)
    try {
      const payload = {
        nom: userInfo?.nom ?? user?.nom ?? '',
        prenom: userInfo?.prenom ?? user?.prenom ?? '',
        dateNaissance: dobToApiFormat(profileInfo.dob) || (profileInfo.dob?.trim() || ''),
        email: profileInfo.email?.trim() ?? '',
        ville: profileInfo.city?.trim() ?? '',
        status: userInfo?.status ?? user?.status ?? '',
        profession: userInfo?.profession ?? user?.profession ?? '',
      }

      const response = await api.post(`/sellprox/utilisateurs/update/${userId}`, payload)
      const ok = response.data?.status === 1 || response.data?.status === 200 || response.status === 200
      if (!ok) {
        Alert.alert('Erreur', response.data?.msg || 'Impossible de mettre à jour le profil.')
        return
      }
      infoSheetRef.current?.close()
      const updatedUser = {
        ...user,
        nom: payload.nom,
        prenom: payload.prenom,
        dateNaissance: payload.dateNaissance || user.dateNaissance,
        email: payload.email,
        ville: payload.ville,
        telephoneBoutique: profileInfo.phone?.trim() ?? user.telephoneBoutique,
        telephone: profileInfo.phone?.trim() ?? user.telephone,
        adresseBoutique: profileInfo.address?.trim() ?? user.adresseBoutique,
        adresse: profileInfo.address?.trim() ?? user.adresse,
      }
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setUserInfo(updatedUser)
      setProfileInfo((prev) => ({
        ...prev,
        phone: updatedUser?.telephoneBoutique ?? prev.phone,
        email: updatedUser?.email ?? prev.email,
        address: updatedUser?.adresse ?? prev.address,
        city: updatedUser?.ville ?? prev.city,
      }))
      Alert.alert('Succès', 'Informations mises à jour.')
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Erreur lors de la mise à jour.'
      Alert.alert('Erreur', msg)
    } finally {
      setInfoLoading(false)
    }
  }

  const savePassword = async () => {
    const pwd = passwordForm.newPassword?.trim()
    const confirm = passwordForm.confirmPassword?.trim()

    if (!pwd || !confirm) {
      setPasswordError('Merci de renseigner les deux champs.')
      return
    }
    if (pwd.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (pwd !== confirm) {
      setPasswordError('Les mots de passe ne correspondent pas.')
      return
    }

    const userId = contextUser?.id
    if (!userId) {
      Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.')
      return
    }

    setPasswordError('')
    setPasswordLoading(true)

    try {
      const response = await api.post(`/sellprox/utilisateurs/mot-de-passe/${userId}`, {
        newPassword: pwd,
        newPasswordConfirm: confirm,
      })

      if (response.data?.status === 1) {
        setPasswordForm({ newPassword: '', confirmPassword: '' })
        securitySheetRef.current?.close()
        Alert.alert('Succès', 'Mot de passe mis à jour.')
      } else {
        setPasswordError(response.data?.msg || 'Impossible de modifier le mot de passe.')
      }
    } catch (error) {
      const msg =
        error.response?.data?.msg ||
        error.message ||
        'Erreur lors de la modification du mot de passe.'
      setPasswordError(msg)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        <Header agentName="Agent connecté" />

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
          }
        >
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <User color={COLORS.white} size={28} />
            </View>
            <Text style={styles.name}>
              {userInfo ? [userInfo.prenom, userInfo.nom].filter(Boolean).join(' ') : '—'}
            </Text>
            <Text style={styles.role}>{userInfo?.roleName || '—'}</Text>

            <View style={styles.status}>
              <Text style={styles.statusText}>Actif</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Informations personnelles</Text>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => infoSheetRef.current?.open()}
              >
                <Edit size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <Info label="Téléphone" value={profileInfo.phone || '-'} />
            <Info label="E-mail" value={profileInfo.email || '-'} />
            <Info label="Adresse" value={profileInfo.address || '-'} />
            <Info label="Ville" value={profileInfo.city || '-'} />
            <Info label="Date de naissance" value={formatDobForDisplay(profileInfo.dob)} />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Sécurité</Text>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  setPasswordError('')
                  setPasswordForm({ newPassword: '', confirmPassword: '' })
                  securitySheetRef.current?.open()
                }}
              >
                <Lock size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setPasswordError('')
                setPasswordForm({ newPassword: '', confirmPassword: '' })
                securitySheetRef.current?.open()
              }}
            >
              <Shield size={18} color={COLORS.white} />
              <Text style={styles.actionText}>Modifier le mot de passe</Text>
            </TouchableOpacity>
          </View>


        </ScrollView>

        <Modalize ref={infoSheetRef} adjustToContentHeight>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Modifier les informations</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="Téléphone"
              value={profileInfo.phone ?? ''}
              onChangeText={(value) =>
                setProfileInfo((prev) => ({ ...prev, phone: value }))
              }
              placeholderTextColor={COLORS.muted}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.sheetInput}
              placeholder="E-mail"
              value={profileInfo.email ?? ''}
              onChangeText={(value) =>
                setProfileInfo((prev) => ({ ...prev, email: value }))
              }
              placeholderTextColor={COLORS.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.sheetInput}
              placeholder="Adresse"
              value={profileInfo.address ?? ''}
              onChangeText={(value) =>
                setProfileInfo((prev) => ({ ...prev, address: value }))
              }
              placeholderTextColor={COLORS.muted}
            />
            <TextInput
              style={styles.sheetInput}
              placeholder="Ville"
              value={profileInfo.city ?? ''}
              onChangeText={(value) =>
                setProfileInfo((prev) => ({ ...prev, city: value }))
              }
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.sheetLabel}>Date de naissance</Text>
            <TouchableOpacity
              style={styles.dateTouchable}
              onPress={() => {
                const parsed = parseDate(profileInfo.dob ?? '')
                setDobDate(parsed || new Date(2000, 0, 1))
                setShowDobPicker(true)
              }}
            >
              <Calendar size={18} color={COLORS.muted} />
              <Text style={[styles.dateTouchableText, !profileInfo.dob && styles.datePlaceholder]}>
                {profileInfo.dob ? formatDate(parseDate(profileInfo.dob)) || profileInfo.dob : 'Choisir une date'}
              </Text>
            </TouchableOpacity>

            {showDobPicker && (
              <>
                <DateTimePicker
                  value={dobDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === 'android') {
                      setShowDobPicker(false)
                    }
                    if (selectedDate) {
                      setDobDate(selectedDate)
                      setProfileInfo((prev) => ({ ...prev, dob: formatDate(selectedDate) }))
                    }
                  }}
                  maximumDate={new Date()}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.dateConfirmBtn}
                    onPress={() => setShowDobPicker(false)}
                  >
                    <Text style={styles.dateConfirmText}>Valider la date</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetButton, styles.sheetButtonGhost]}
                onPress={() => infoSheetRef.current?.close()}
              >
                <Text style={styles.sheetButtonGhostText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
              style={[styles.sheetButton, infoLoading && styles.sheetButtonDisabled]}
              onPress={saveInfo}
              disabled={infoLoading}
            >
              {infoLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sheetButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
            </View>
          </View>
        </Modalize>

        <Modalize ref={securitySheetRef} adjustToContentHeight>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Sécurité</Text>

            <TextInput
              style={styles.sheetInput}
              placeholder="Nouveau mot de passe"
              value={passwordForm.newPassword}
              onChangeText={(value) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: value }))
              }
              placeholderTextColor={COLORS.muted}
              secureTextEntry
            />
            <TextInput
              style={styles.sheetInput}
              placeholder="Confirmer mot de passe"
              value={passwordForm.confirmPassword}
              onChangeText={(value) =>
                setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))
              }
              placeholderTextColor={COLORS.muted}
              secureTextEntry
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetButton, styles.sheetButtonGhost]}
                onPress={() => !passwordLoading && securitySheetRef.current?.close()}
                disabled={passwordLoading}
              >
                <Text style={styles.sheetButtonGhostText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetButton, passwordLoading && styles.sheetButtonDisabled]}
                onPress={savePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.sheetButtonText}>Mettre à jour</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modalize>
    </View>
    </KeyboardAvoidingView>
  )
}

const Info = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    margin: 12,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
    color: COLORS.text,
  },
  role: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  status: {
    marginTop: 8,
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: COLORS.text,
  },
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  infoValue: {
    fontWeight: '600',
    color: COLORS.text,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    padding: 20,
    gap: 10,
  },
  sheetLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
  },
  dateTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateTouchableText: {
    fontSize: 15,
    color: COLORS.text,
  },
  datePlaceholder: {
    color: COLORS.muted,
  },
  dateConfirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  dateConfirmText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sheetInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  sheetButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetButtonDisabled: {
    opacity: 0.7,
  },
  sheetButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  sheetButtonGhost: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetButtonGhostText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
  },
})