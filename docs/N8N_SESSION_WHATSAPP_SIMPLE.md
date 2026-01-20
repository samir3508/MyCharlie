# 📱 Comment séparer les conversations par numéro WhatsApp de l'artisan

## 🎯 Le principe simple

**Chaque artisan a son numéro WhatsApp unique** → On utilise ce numéro pour séparer les conversations.

---

## ✅ Solution SIMPLE pour N8N

### Dans le nœud "Postgres Supa" :

**Configuration :**
```
Clé : {{ $json.body.context.tenant_id }}
Session ID : {{ $json.body.context.tenant_id }}-whatsapp-{{ $json.body.context.whatsapp_phone || $json.sessionId }}
```

**Explication :**
- **Clé** = `tenant_id` → Pour la sécurité (RLS)
- **Session ID** = `tenant_id-whatsapp-numero` → Pour séparer les conversations

**Exemple :**
- Artisan 1 : `97c62509-84ff-4e87-8ba9-c3095b7fd30f-whatsapp-33745108883`
- Artisan 2 : `97c62509-84ff-4e87-8ba9-c3095b7fd30f-whatsapp-33612345678`
- Web : `97c62509-84ff-4e87-8ba9-c3095b7fd30f-chat-abc123` (si pas de whatsapp_phone, utilise sessionId)

---

## 🔍 Comment ça fonctionne

### 1. Message WhatsApp (depuis l'artisan)
- `whatsapp_phone` = `"+33745108883"` (numéro de l'artisan)
- `tenant_id` = `"97c62509-..."` (ID du tenant)
- **Session ID généré** = `"97c62509-...-whatsapp-33745108883"`

### 2. Message Web (depuis l'application)
- `whatsapp_phone` = `null` (pas de numéro)
- `tenant_id` = `"97c62509-..."`
- **Session ID généré** = `sessionId` de N8N (ex: `"chat-abc123"`)

---

## 📊 Résultat

### Avant (problème) :
```
Session ID: "97c62509-..." (juste le tenant_id)
├── Message Artisan 1 (+33745108883)
├── Message Artisan 2 (+33612345678)
├── Message Artisan 1 (+33745108883)
└── Message Web (pas de numéro)
→ Tout mélangé ! ❌
```

### Après (corrigé) :
```
Tenant: "97c62509-..."
├── Session: "97c62509-...-whatsapp-33745108883" (Artisan 1)
│   ├── Message 1
│   └── Message 2
├── Session: "97c62509-...-whatsapp-33612345678" (Artisan 2)
│   ├── Message 1
│   └── Message 2
└── Session: "chat-abc123" (Web)
    └── Message 1
→ Chaque artisan a sa propre conversation ! ✅
```

---

## 🔧 Configuration dans N8N (étape par étape)

### Étape 1 : Ouvrir le nœud "Postgres Supa"

### Étape 2 : Configurer la "Clé"
```
{{ $json.body.context.tenant_id }}
```
(C'est pour la sécurité - ne change pas)

### Étape 3 : Configurer le "Session ID"
**Option 1 (avec whatsapp_phone) :**
```
{{ $json.body.context.tenant_id }}-whatsapp-{{ $json.body.context.whatsapp_phone }}
```

**Option 2 (plus simple - utilise tenant_id + sessionId si pas de whatsapp_phone) :**
```
{{ $json.body.context.tenant_id }}-{{ $json.body.context.whatsapp_phone || 'web' }}-{{ $json.sessionId }}
```

**Option 3 (RECOMMANDÉE - la plus simple) :**
```
{{ $json.body.context.whatsapp_phone ? ($json.body.context.tenant_id + '-whatsapp-' + $json.body.context.whatsapp_phone.replace(/[+\s-]/g, '')) : $json.sessionId }}
```

---

## ⚡ Solution ULTRA SIMPLE (recommandée)

Dans le nœud "Postgres Supa" → "Session ID" :

**Si vous voulez vraiment simple, copiez-collez ça :**
```
{{ $json.body.context.whatsapp_phone ? ($json.body.context.tenant_id + '-whatsapp-' + $json.body.context.whatsapp_phone.replace(/[+\s-]/g, '')) : ($json.body.context.tenant_id + '-web-' + ($json.sessionId || 'default')) }}
```

**Explication :**
- Si `whatsapp_phone` existe → `tenant_id-whatsapp-numero` (ex: `97c62509-...-whatsapp-33745108883`)
- Sinon → `tenant_id-web-sessionId` (ex: `97c62509-...-web-chat-abc123`)

---

## ✅ Vérification

Après avoir changé la configuration, testez :

1. **Envoyer un message depuis WhatsApp** (Artisan 1)
   - Vérifier dans N8N que le Session ID est `tenant_id-whatsapp-numero1`

2. **Envoyer un message depuis WhatsApp** (Artisan 2)
   - Vérifier que le Session ID est `tenant_id-whatsapp-numero2`

3. **Envoyer un message depuis l'application web**
   - Vérifier que le Session ID est `tenant_id-web-sessionId`

---

## 🎯 Résultat final

- ✅ Chaque artisan a ses propres conversations (séparées par numéro WhatsApp)
- ✅ Les conversations web sont séparées des conversations WhatsApp
- ✅ Toutes les conversations restent liées au bon tenant (sécurité RLS)
- ✅ Pas de mélange entre artisans

---

## 💡 Astuce

Le numéro WhatsApp est automatiquement nettoyé (espaces, `+`, `-` supprimés) pour garantir un format cohérent.

Exemple :
- `"+33 7 45 10 88 83"` → `"33745108883"`
- `"+33-7-45-10-88-83"` → `"33745108883"`
