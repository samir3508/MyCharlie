# Statut de déploiement des Edge Functions

## ✅ Fonctions déployées

1. ✅ **search-client** - Déployée avec succès
   - ID: 0a65dc1a-d31f-4486-bb0d-a235b0e1ea1f
   - Version: 1
   - Status: ACTIVE
   - URL: https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1/search-client

## ⏳ Fonctions à déployer

2. ⏳ **create-client** - En attente
3. ⏳ **create-devis** - En attente (nécessite business.ts)
4. ⏳ **add-ligne-devis** - En attente (nécessite business.ts)
5. ⏳ **finalize-devis** - En attente (nécessite business.ts)
6. ⏳ **send-devis** - En attente

## 📝 Note importante

Pour déployer les fonctions restantes via MCP, il faut inclure tous les fichiers _shared dans chaque déploiement :
- _shared/auth.ts
- _shared/db.ts
- _shared/errors.ts
- _shared/validation.ts
- _shared/business.ts (pour certaines fonctions)

Les imports doivent utiliser `./_shared/` au lieu de `../_shared/` car chaque fonction est déployée dans son propre contexte.
