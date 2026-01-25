/**
 * Gestion des erreurs pour Edge Functions
 */

export interface ErrorResponse {
  success: false
  error: string
  message: string
  details?: any
}

export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: any
): Response {
  const body: ErrorResponse = {
    success: false,
    error: code,
    message,
    ...(details && { details })
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  })
}

export function successResponse<T>(data: T, message?: string): Response {
  const body: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  }
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  })
}

export function handleZodError(error: any): Response {
  return errorResponse(
    400,
    'VALIDATION_ERROR',
    'Erreur de validation des données',
    { errors: error.errors }
  )
}

export function handleSupabaseError(error: any): Response {
  const code = error.code || 'SUPABASE_ERROR'
  const message = error.message || 'Erreur lors de l\'opération sur la base de données'
  return errorResponse(500, code, message, { details: error })
}
