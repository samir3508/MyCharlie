# Déploiement de la route `/api/send-devis`

La route **`/api/send-devis`** est un fallback de l’Edge Function Supabase `send-devis`. Quand l’Edge Function renvoie 404, le Code Tool n8n appelle cette route pour envoyer le devis par email (avec PDF en pièce jointe).

## 1. Vérifier que la route est bien dans le projet

- Fichier : `src/app/api/send-devis/route.ts`
- URL : `https://<VOTRE_APP>/api/send-devis` (méthode **POST**)

## 2. Variables d’environnement obligatoires

Sur l’app Next.js (Vercel, Render, etc.) :

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Même clé que dans n8n (Code Tool) : utilisée pour l’auth `Authorization: Bearer` et les requêtes Supabase |
| `APP_URL` ou `NEXT_PUBLIC_APP_URL` | URL de l’app (ex. `https://mycharlie.fr`) pour appeler `/api/pdf/devis/` et `/api/email/send-gmail` en interne |

Les variables pour Gmail (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) sont déjà utilisées par `/api/email/send-gmail`.

## 3. Déploiement

### Vercel

1. Commit + push du fichier `src/app/api/send-devis/route.ts`.
2. Déploiement automatique si le repo est connecté, ou `vercel --prod`.
3. Dans **Project → Settings → Environment Variables**, définir :
   - `SUPABASE_SERVICE_ROLE_KEY` (si pas déjà fait)
   - `APP_URL` = `https://mycharlie.fr` (ou l’URL de prod de l’app)

### Render

1. Commit + push.
2. Render déploie si **Auto-Deploy** est activé.
3. Dans **Dashboard → my-leo-saas → Environment** :
   - `SUPABASE_SERVICE_ROLE_KEY` (déjà dans `render.yaml`)
   - `APP_URL` ou `NEXT_PUBLIC_APP_URL` = URL du service (ex. `https://my-leo-saas.onrender.com`) ou domaine custom (`https://mycharlie.fr`)

## 4. n8n – Code Tool

- `CONFIG.APP_URL` (ou `$env.APP_URL`) doit pointer vers **la même app** que celle où `/api/send-devis` est déployée.
- Par défaut : `https://mycharlie.fr`. Si votre app est ailleurs, définir `APP_URL` dans les variables d’environnement du nœud n8n / du workflow.

## 5. Test manuel

```bash
curl -X POST 'https://mycharlie.fr/api/send-devis' \
  -H 'Authorization: Bearer VOTRE_SUPABASE_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "tenant_id": "4370c96b-2fda-4c4f-a8b5-476116b8f2fc",
    "devis_id": "82a25011-600f-454e-88e1-9eb046cd4761",
    "method": "email",
    "recipient_email": "adlbapp4@gmail.com"
  }'
```

- **200** + `{"success":true,...}` → OK (ou 400 si Gmail non connecté, 404 si devis/client introuvable).
- **404** → la route n’est pas déployée ou l’URL est incorrecte.
- **401** → `Authorization: Bearer` absent ou `SUPABASE_SERVICE_ROLE_KEY` différent de celui de l’app.

## 6. En cas de 404 après déploiement

- Vérifier l’URL : `CONFIG.APP_URL` dans n8n = URL réelle de l’app (sans slash final).
- Vérifier que le déploiement inclut `src/app/api/send-devis/route.ts` (bonne branche, pas de `.vercelignore` / exclusions qui l’excluent).
- Tester la même URL avec `curl` comme ci‑dessus.
