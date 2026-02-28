// Centralized French error messages — single source of truth for all AppError messages.

export const AUTH = {
  DUPLICATE_EMAIL: 'Un compte avec cet email existe déjà',
  DUPLICATE_PHONE: 'Un compte avec ce numéro existe déjà',
  INVALID_CREDENTIALS: 'Identifiants invalides',
  OTP_RATE_LIMIT: 'Trop de demandes. Réessayez dans quelques minutes.',
} as const;

export const ORDER = {
  NOT_FOUND: 'Commande non trouvée',
  UNKNOWN_SERVICE: (t: string) => `Type de service inconnu: ${t}`,
  CANNOT_CANCEL: 'Cette commande ne peut pas être annulée',
  NOT_COMPLETED: 'Seules les commandes terminées peuvent être évaluées',
  ALREADY_RATED: 'Cette commande a déjà été évaluée',
  INVALID_TRANSITION: 'Transition de statut invalide',
  PRO_ONLY_STATUS: 'Seul le professionnel peut mettre à jour le statut',
} as const;

export const NEGOTIATION = {
  NOT_FOUND: 'Commande non trouvée',
  FORBIDDEN: 'Accès non autorisé à cette commande',
  NOT_NEGOTIATING: 'La commande n\'est pas en négociation',
  AMOUNT_OUT_OF_RANGE: (floor: number, ceiling: number) => `Montant hors limites (${floor}–${ceiling} MAD)`,
  AMOUNT_NOT_MULTIPLE: 'Montant doit être un multiple de 5',
  OFFER_NOT_FOUND: 'Offre non trouvée',
  OFFER_NOT_PENDING: 'Cette offre n\'est plus en attente',
  CANNOT_ACCEPT_OWN: 'Vous ne pouvez pas accepter votre propre offre',
} as const;

export const ADMIN = {
  ORDER_NOT_FOUND: 'Commande non trouvée',
  USER_NOT_FOUND: 'Utilisateur non trouvé',
} as const;

export const COMMON = {
  FORBIDDEN: 'Accès interdit',
  NOT_FOUND: 'Utilisateur non trouvé',
  VALIDATION_ERROR: 'Données invalides',
  INTERNAL_ERROR: 'Erreur interne du serveur',
} as const;
