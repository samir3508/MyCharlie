# 🚀 Configuration Rapide : Transcription Vocale Twilio

## 📝 Résumé en 3 étapes

1. **Détecter** si c'est un message vocal (Twilio envoie `NumMedia > 0`)
2. **Télécharger** l'audio depuis l'URL Twilio
3. **Transcrire** avec OpenAI Whisper et envoyer à LÉO

---

## ⚙️ Configuration des Credentials dans n8n

### 1. Twilio Basic Auth (pour télécharger l'audio)

**Settings → Credentials → Add Credential → HTTP Basic Auth**

- **Name** : `Twilio Basic Auth`
- **User** : `{{ $env.TWILIO_ACCOUNT_SID }}` (ou directement ton Account SID)
- **Password** : `{{ $env.TWILIO_AUTH_TOKEN }}` (ou directement ton Auth Token)

**Ou directement dans le node HTTP Request :**
- **Authentication** : `Basic Auth`
- **Username** : `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (ton Account SID)
- **Password** : `ton_auth_token_ici`

---

### 2. OpenAI API (pour Whisper)

**Settings → Credentials → Add Credential → OpenAI API**

- **Name** : `OpenAI API`
- **API Key** : `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🔍 Comment tester

### Test 1 : Message texte (doit fonctionner normalement)

1. Envoie un message texte via WhatsApp
2. Vérifie que ça passe par la branche "Format Text Message for LEO"
3. LÉO doit répondre normalement

### Test 2 : Message vocal

1. Envoie un message vocal via WhatsApp (ex: "Bonjour, j'ai besoin d'un devis")
2. Dans n8n, vérifie que :
   - Le node "Check if Voice Message" détecte `true`
   - Le node "Download Audio" télécharge le fichier
   - Le node "Transcribe" retourne le texte
   - LÉO reçoit le texte transcrit et répond

---

## 🐛 Dépannage

### Erreur : "401 Unauthorized" lors du téléchargement

**Problème** : Les credentials Twilio sont incorrects

**Solution** :
- Vérifie ton Account SID et Auth Token dans Twilio Console
- Vérifie que le node HTTP Request utilise bien "Basic Auth"
- Teste l'URL manuellement avec curl :
  ```bash
  curl -u "ACxxx:token" "https://api.twilio.com/2010-04-01/Accounts/ACxxx/Messages/SMxxx/Media/MExxx"
  ```

---

### Erreur : "File too large" dans Whisper

**Problème** : L'audio dépasse 25 MB (limite Whisper)

**Solution** :
- Les messages vocaux WhatsApp sont généralement < 1 MB, donc ça ne devrait pas arriver
- Si ça arrive, ajoute un node pour vérifier la taille avant de transcrire

---

### Erreur : "No audio detected" ou transcription vide

**Problème** : L'audio est corrompu ou silencieux

**Solution** :
- Vérifie que le format audio est supporté (Twilio envoie généralement `audio/ogg`)
- Ajoute une gestion d'erreur pour retourner un message à l'utilisateur

---

### Le message vocal n'est pas détecté

**Problème** : Le node "Check if Voice Message" ne fonctionne pas

**Solution** :
- Vérifie le payload Twilio dans les logs du webhook
- Assure-toi que `NumMedia` est bien présent et > 0
- Vérifie que `MediaContentType0` commence bien par `audio/`

**Expression à tester** :
```javascript
{{ $json.body.NumMedia && parseInt($json.body.NumMedia) > 0 && $json.body.MediaContentType0 && $json.body.MediaContentType0.startsWith('audio/') }}
```

---

## 📊 Format du payload Twilio

### Message texte
```json
{
  "MessageSid": "SM...",
  "From": "whatsapp:+33612345678",
  "To": "whatsapp:+14155238886",
  "Body": "Bonjour, j'ai besoin d'un devis",
  "NumMedia": "0"
}
```

### Message vocal
```json
{
  "MessageSid": "SM...",
  "From": "whatsapp:+33612345678",
  "To": "whatsapp:+14155238886",
  "Body": "",
  "NumMedia": "1",
  "MediaUrl0": "https://api.twilio.com/2010-04-01/Accounts/AC.../Messages/SM.../Media/ME...",
  "MediaContentType0": "audio/ogg; codecs=opus"
}
```

---

## ✅ Checklist finale

- [ ] Credentials Twilio configurés dans n8n
- [ ] Credentials OpenAI configurés dans n8n
- [ ] Workflow importé dans n8n
- [ ] Node "Check if Voice Message" configuré
- [ ] Node "Download Audio" avec Basic Auth
- [ ] Node "Transcribe" avec OpenAI Whisper
- [ ] Test message texte : ✅
- [ ] Test message vocal : ✅

---

## 💡 Astuce : Améliorer la précision

Dans le node "Transcribe Audio with Whisper", ajoute dans **Options** :

- **Language** : `fr` (pour forcer le français)
- **Temperature** : `0` (pour plus de précision, moins de créativité)
- **Prompt** : `"Transcription d'un message vocal d'un professionnel du BTP parlant de devis, factures, clients et chantiers."` (optionnel, pour améliorer la reconnaissance des termes techniques)

---

## 🔗 Liens utiles

- [Twilio Media API Docs](https://www.twilio.com/docs/messaging/media)
- [OpenAI Whisper API Docs](https://platform.openai.com/docs/guides/speech-to-text)
- [n8n HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [n8n OpenAI Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.openai/)
















