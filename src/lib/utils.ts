import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '0,00 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

// Format date
export function formatDate(date: string | null | undefined): string {
  if (!date) return ''
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return date
  }
}

// Get status label for devis
export function getStatusLabel(statut: string): string {
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    envoye: 'Envoyé',
    accepte: 'Accepté',
    refuse: 'Refusé',
    expire: 'Expiré',
    paye: 'Payé',
    // Factures
    envoyee: 'Envoyée',
    payee: 'Payée',
    en_retard: 'En retard',
  }
  return labels[statut] || statut
}

// Get status color class for badges (devis)
export function getStatusColor(statut: string): string {
  const colors: Record<string, string> = {
    brouillon: 'bg-gray-900/30 text-gray-400 border-gray-800/50',
    envoye: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
    accepte: 'bg-green-900/30 text-green-400 border-green-800/50',
    refuse: 'bg-red-900/30 text-red-400 border-red-800/50',
    expire: 'bg-orange-900/30 text-orange-400 border-orange-800/50',
    paye: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50',
    // Factures
    envoyee: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
    payee: 'bg-green-900/30 text-green-400 border-green-800/50',
    en_retard: 'bg-red-900/30 text-red-400 border-red-800/50',
  }
  return colors[statut] || 'bg-gray-900/30 text-gray-400 border-gray-800/50'
}

// Check if date is overdue
export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false
  try {
    const dueDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate < today
  } catch {
    return false
  }
}

// Get initials from a name or company name
export function getInitials(name: string | null | undefined): string {
  if (!name) return ''
  
  const words = name.trim().split(/\s+/).filter(word => word.length > 0)
  
  if (words.length === 0) return ''
  if (words.length === 1) {
    // Single word: take first 2 letters
    return words[0].substring(0, 2).toUpperCase()
  }
  
  // Multiple words: take first letter of first two words
  return (words[0][0] + words[1][0]).toUpperCase()
}

// Format phone number (French format)
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Format as XX XX XX XX XX (French format)
  if (digits.length === 10) {
    return `${digits.substring(0, 2)} ${digits.substring(2, 4)} ${digits.substring(4, 6)} ${digits.substring(6, 8)} ${digits.substring(8, 10)}`
  }
  
  // If not 10 digits, return as is
  return phone
}
