/**
 * Authentification pour Edge Functions Supabase
 */

export interface AuthResult {
  success: boolean
  error?: {
    code: string
    message: string
  }
}

/**
 * Valide l'authentification d'une requête
 * Accepte soit un Bearer token (service_role ou anon key), soit un header Authorization
 */
export function validateAuth(req: Request): AuthResult {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token d\'authentification manquant'
      }
    }
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Format de token invalide. Utilisez "Bearer <token>"'
      }
    }
  }
  
  return { success: true }
}
