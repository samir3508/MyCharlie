# 📱 N8N - Détection message audio avec WhatsApp Trigger

## ❌ Expression Twilio (ne fonctionne PAS avec WhatsApp Trigger)

```javascript
{{ $json.body.NumMedia && parseInt($json.body.NumMedia) > 0 && $json.body.MediaContentType0 && $json.body.MediaContentType0.startsWith('audio/') }}
```

**Pourquoi ça ne marche pas :**
- `NumMedia` et `MediaContentType0` sont des champs spécifiques à **Twilio**
- Avec **WhatsApp Trigger**, la structure des données est différente

---

## ✅ Expressions pour WhatsApp Trigger

### Option 1 : Vérifier le type de message (RECOMMANDÉE)

Dans le nœud **"Check Message ou vocaux"**, utilisez :

```javascript
{{ $json.body.type === 'audio' }}
```

OU (si le type est dans un autre emplacement) :

```javascript
{{ $json.type === 'audio' }}
```

OU (plus robuste) :

```javascript
{{ $json.body.type === 'audio' || $json.type === 'audio' }}
```

---

### Option 2 : Vérifier si c'est un message texte

Si vous voulez détecter les messages **texte** (pour la branche FALSE) :

```javascript
{{ $json.body.type === 'text' }}
```

---

### Option 3 : Vérifier plusieurs types audio possibles

Si WhatsApp envoie différents types audio :

```javascript
{{ ['audio', 'voice', 'ptt'].includes($json.body.type) }}
```

---

## 🔍 Comment vérifier la structure des données

### Étape 1 : Exécuter le workflow avec un message vocal

1. Envoyez un message vocal depuis WhatsApp au numéro connecté
2. Dans N8N, **cliquez sur le nœud "WhatsApp Trigger"**
3. **Regardez l'INPUT** du nœud (section "Input" en bas)
4. **Cherchez le champ `type`** dans le JSON

### Étape 2 : Trouver où se trouve le `type`

Le `type` peut être à différents endroits :
- `$json.body.type` - Si dans le body
- `$json.type` - Si à la racine
- `$json.body.message.type` - Si dans un sous-objet message

**Exemple de structure WhatsApp Trigger :**
```json
{
  "body": {
    "type": "audio",
    "message": "Message texte (si disponible)",
    "From": "whatsapp:+33612345678",
    ...
  }
}
```

OU

```json
{
  "type": "audio",
  "body": {
    "message": "...",
    "From": "..."
  }
}
```

---

## ✅ Solution finale (à tester)

### Branche TRUE (message vocal)

**Expression :**
```javascript
{{ $json.body.type === 'audio' }}
```

**Ou si ça ne marche pas, essayez :**
```javascript
{{ $json.body.type === 'audio' || $json.type === 'audio' || $json.body.message_type === 'audio' }}
```

---

## 🧪 Test rapide

### Test 1 : Message vocal

1. Envoyez un message vocal WhatsApp
2. Dans le nœud "Check Message ou vocaux", vérifiez l'INPUT
3. Cherchez le champ qui indique "audio"
4. Utilisez ce champ dans la condition

### Test 2 : Message texte

1. Envoyez un message texte WhatsApp
2. Vérifiez que la branche FALSE est prise (pas TRUE)
3. Si ce n'est pas le cas, ajustez l'expression

---

## 📝 Configuration du nœud "Check Message ou vocaux"

### Mode : "Rules"

**Rule 1 : Message vocal**
- **Value 1** : `{{ $json.body.type }}`
- **Operation** : equals
- **Value 2** : `audio`

**Ou si le nœud utilise "Expression" :**

**Expression :**
```javascript
{{ $json.body.type === 'audio' }}
```

---

## ⚠️ Si l'erreur persiste

L'erreur dit : **"Wrong type: 'messages' is a string but was expecting a boolean"**

Cela signifie que l'expression retourne une **string** (`"messages"`) au lieu d'un **boolean** (`true` ou `false`).

**Solution :** Assurez-vous que votre expression retourne un boolean :

✅ **Bien :**
```javascript
{{ $json.body.type === 'audio' }}  // Retourne true ou false
```

❌ **Mal :**
```javascript
{{ $json.body.messages }}  // Retourne une string ou un objet
```

---

## 🎯 Expression finale recommandée

Copiez-collez ceci dans le nœud "Check Message ou vocaux" :

**Pour détecter les messages audio :**
```javascript
{{ $json.body.type === 'audio' || $json.type === 'audio' }}
```

**Pour détecter les messages texte (branche FALSE) :**
```javascript
{{ $json.body.type === 'text' || $json.type === 'text' || !($json.body.type === 'audio' || $json.type === 'audio') }}
```

---

## 💡 Astuce

Si vous n'êtes pas sûr de la structure, créez un nœud **"Code"** juste après le WhatsApp Trigger pour logger les données :

```javascript
// Logger les données pour déboguer
console.log('Full JSON:', JSON.stringify($input.item.json, null, 2))
console.log('Body type:', $input.item.json.body?.type)
console.log('Root type:', $input.item.json.type)

return $input.item.json
```

Ensuite, exécutez le workflow et regardez les logs pour voir exactement où se trouve le `type`.
