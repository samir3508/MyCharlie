#!/bin/bash

echo "🚀 Déploiement des Edge Functions LÉO..."
echo ""

# Vérifier que supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

# Déployer chaque fonction
echo "📦 Déploiement de search-client..."
supabase functions deploy search-client

echo "📦 Déploiement de create-client..."
supabase functions deploy create-client

echo "📦 Déploiement de create-devis..."
supabase functions deploy create-devis

echo "📦 Déploiement de add-ligne-devis..."
supabase functions deploy add-ligne-devis

echo "📦 Déploiement de finalize-devis..."
supabase functions deploy finalize-devis

echo "📦 Déploiement de send-devis..."
supabase functions deploy send-devis

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📝 N'oubliez pas de configurer LEO_API_SECRET dans Supabase Dashboard"
echo "   Edge Functions → Settings → Secrets → Add Secret"
