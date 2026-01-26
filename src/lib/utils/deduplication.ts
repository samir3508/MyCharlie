/**
 * Utilitaires pour éviter les envois multiples de notifications
 */

interface NotificationCache {
  [key: string]: {
    timestamp: number;
    sent: boolean;
  };
}

// Cache en mémoire pour éviter les doublons (valide 5 minutes)
const notificationCache: NotificationCache = {};

/**
 * Génère une clé unique pour une notification basée sur le tenant, type et contenu
 */
export function generateNotificationKey(tenantId: string, type: string, titre: string, message: string): string {
  // Normaliser les chaînes pour éviter les différences mineures
  const normalizedTitre = titre.trim().toLowerCase();
  const normalizedMessage = message.trim().toLowerCase();
  
  return `${tenantId}:${type}:${normalizedTitre}:${normalizedMessage}`;
}

/**
 * Vérifie si une notification a déjà été envoyée récemment
 */
export function isNotificationAlreadySent(key: string, maxAgeMs: number = 30000): boolean {
  const cached = notificationCache[key];
  
  if (!cached) {
    return false;
  }
  
  const now = Date.now();
  const age = now - cached.timestamp;
  
  return age < maxAgeMs && cached.sent;
}

/**
 * Marque une notification comme envoyée
 */
export function markNotificationAsSent(key: string): void {
  notificationCache[key] = {
    timestamp: Date.now(),
    sent: true
  };
  
  // Nettoyer le cache périodiquement (supprimer les entrées de plus de 5 minutes)
  cleanupCache();
}

/**
 * Nettoie le cache des anciennes entrées
 */
function cleanupCache(): void {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  Object.keys(notificationCache).forEach(key => {
    const entry = notificationCache[key];
    if (now - entry.timestamp > maxAge) {
      delete notificationCache[key];
    }
  });
}

/**
 * Fonction utilitaire pour vérifier et marquer une notification en une seule étape
 */
export function shouldSendNotification(tenantId: string, type: string, titre: string, message: string): boolean {
  const key = generateNotificationKey(tenantId, type, titre, message);
  
  if (isNotificationAlreadySent(key)) {
    return false;
  }
  
  markNotificationAsSent(key);
  return true;
}

/**
 * Crée un délai pour éviter les envois simultanés
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
