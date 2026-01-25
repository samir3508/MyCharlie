/**
 * Setup global pour les tests Vitest
 */

import { config } from 'dotenv'

// Charger les variables d'environnement depuis .env.local
config({ path: '.env.local' })

// Vérifier que les variables essentielles sont présentes
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined in .env.local')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in .env.local')
}

console.log('✅ Tests setup completed')
console.log('📦 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('🔑 Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing')
