# 🎯 IMPLÉMENTATION MANAGER AGENT ROUTER

## Objectif

Ajouter un agent Manager qui analyse les messages et route intelligemment vers Charlie (commercial) ou LÉO (terrain).

---

## 🏗️ Architecture proposée

```
[Chat Trigger] 
    ↓
[Manager Agent - Analyse intention]
    ↓           ↓
[Charlie]   [LÉO]
(commercial) (terrain)
```

---

## 📝 Configuration N8N

### Étape 1 : Ajouter le nœud Manager Agent

1. **Ouvrir le workflow** `LÉO - Agent IA BTP avec leo-router`
2. **Ajouter un nouveau nœud** entre `Chat Trigger` et `AI Agent LÉO`
3. **Type** : `AI Agent`
4. **Nom** : `Manager - Router`

### Étape 2 : Configurer Manager Agent

#### Paramètres du nœud

**System Message :**
```
Tu es le MANAGER, un router intelligent qui analyse les messages et détermine quel agent doit répondre.

Tu as 2 agents sous ta responsabilité :
- **CHARLIE** : Agent commercial (devis, factures, clients, relances, envoyer)
- **LÉO** : Agent terrain (RDV, planning, dossiers, visites, stats)

RÈGLE ABSOLUE : Tu NE RÉPONDS JAMAIS directement. Tu ANALYSES et tu ROUTES.

## COMMENT ANALYSER

Analyse le message de l'utilisateur et identifie l'intention :

### Messages pour CHARLIE (Commercial)
- Créer/modifier/chercher un CLIENT
- Créer/modifier un DEVIS
- Envoyer un DEVIS
- Créer/modifier une FACTURE
- Envoyer une FACTURE
- Relancer un client (devis ou facture)
- Questions sur montants, CA, paiements

**Exemples :**
- "Crée un client Martin Jean"
- "Fais un devis pour Dupont avec 5000€"
- "Envoie le devis DV-2026-0001"
- "Crée une facture pour Martin"
- "Relance la facture FA-2026-0001"

### Messages pour LÉO (Terrain)
- Consulter le PLANNING / AGENDA
- Créer/modifier un RDV
- Gérer les DOSSIERS
- Créer/voir des FICHES DE VISITE
- Demander des STATS / STATISTIQUES
- Questions opérationnelles

**Exemples :**
- "J'ai quoi demain ?"
- "Organise une visite avec Dupont mardi 14h"
- "Combien j'ai de dossiers actifs ?"
- "Quelles sont mes factures en retard ?"
- "Quel est mon CA du mois ?"

### Messages AMBIGUS
Si le message est ambigu ou peut concerner les deux agents :
- Demander une clarification
- "Voulez-vous parler du devis (Charlie) ou du planning (LÉO) ?"

## FORMAT DE SORTIE

Tu DOIS retourner un JSON avec cette structure EXACTE :

{
  "agent": "charlie" | "leo" | "ambiguous",
  "confidence": 0.0-1.0,
  "reason": "Explication courte de ta décision",
  "message_for_agent": "Message original ou reformulé pour l'agent"
}

**Exemples :**

Message : "Fais un devis pour Martin"
→ {
    "agent": "charlie",
    "confidence": 0.95,
    "reason": "Demande de création de devis",
    "message_for_agent": "Fais un devis pour Martin"
  }

Message : "J'ai quoi demain ?"
→ {
    "agent": "leo",
    "confidence": 1.0,
    "reason": "Consultation du planning",
    "message_for_agent": "J'ai quoi demain ?"
  }

Message : "Contact Martin"
→ {
    "agent": "ambiguous",
    "confidence": 0.5,
    "reason": "Pas clair si c'est pour créer client (Charlie) ou consulter dossier (LÉO)",
    "message_for_agent": "Voulez-vous créer un client ou consulter un dossier existant ?"
  }
```

**Options :**
- Require Specific Output Format : **JSON**
- Output Key : `routing_decision`

### Étape 3 : Ajouter le nœud Switch

Après le Manager, ajouter un nœud **Switch** :

**Paramètres :**
- Mode : `Rules`
- Rules :
  1. **Rule 1 (Charlie)** :
     - Value : `{{ $json.routing_decision.agent }}`
     - Operation : `equals`
     - Value2 : `charlie`
  2. **Rule 2 (LÉO)** :
     - Value : `{{ $json.routing_decision.agent }}`
     - Operation : `equals`
     - Value2 : `leo`
  3. **Rule 3 (Ambiguous)** :
     - Value : `{{ $json.routing_decision.agent }}`
     - Operation : `equals`
     - Value2 : `ambiguous`

### Étape 4 : Créer le nœud Charlie Agent

Dupliquer le nœud "AI Agent LÉO" et renommer en "AI Agent Charlie"

**System Message pour Charlie :**
Utiliser le contenu de `docs/CHARLIE_PROMPT_N8N_FINAL.md`

**Outils pour Charlie :**
- Supabase MCP (même que LÉO)
- Gmail (Send a message)
- Code Tool (pour appeler Edge Functions)

### Étape 5 : Connecter les nœuds

```
[Chat Trigger]
    ↓
[Manager Agent]
    ↓
[Switch]
    ↓           ↓           ↓
[Charlie]   [LÉO]   [Response Ambiguous]
    ↓           ↓           ↓
[Format Response]
    ↓
[Send Response]
```

### Étape 6 : Ajouter Response Ambiguous

Pour gérer les messages ambigus :

**Type** : `Code`
**Code :**
```javascript
const routing = $input.item.json.routing_decision

return {
  json: {
    message: routing.message_for_agent,
    metadata: {
      type: 'clarification',
      original_message: $input.item.json.body.message
    }
  }
}
```

---

## 🧪 Tests à effectuer

### Test 1 : Routage vers Charlie
```
Message : "Crée un devis pour Martin avec 1000€"
Attendu : Manager route vers Charlie
Résultat : Devis créé
```

### Test 2 : Routage vers LÉO
```
Message : "J'ai quoi demain ?"
Attendu : Manager route vers LÉO
Résultat : Planning du lendemain
```

### Test 3 : Message ambigu
```
Message : "Contact Martin"
Attendu : Manager demande clarification
Résultat : "Voulez-vous créer un client ou consulter un dossier ?"
```

### Test 4 : Changement de contexte
```
Message 1 : "Fais un devis pour Martin" → Charlie
Message 2 : "J'ai quoi demain ?" → LÉO
Attendu : Manager route vers LÉO (nouveau contexte)
Résultat : Planning affiché
```

---

## 📊 Monitoring

### Logs Manager

Ajouter un nœud de logging après Manager pour suivre les décisions :

```javascript
const routing = $input.item.json.routing_decision

console.log('🎯 MANAGER DECISION:', {
  message: $input.item.json.body.message,
  agent: routing.agent,
  confidence: routing.confidence,
  reason: routing.reason,
  timestamp: new Date().toISOString()
})

return $input.item
```

### Métriques à suivre

- % de messages routés vers Charlie vs LÉO
- % de messages ambigus
- Temps de réponse moyen par agent
- Taux de satisfaction utilisateur

---

## 🚀 Déploiement

### Avant de déployer

1. ✅ Tester le routage avec 20+ messages variés
2. ✅ Vérifier que Charlie et LÉO fonctionnent indépendamment
3. ✅ Vérifier que les messages ambigus sont bien gérés
4. ✅ Tester le changement de contexte

### Activer en production

1. Dans N8N, cliquez sur **`Activate`** (toggle en haut)
2. Le workflow est maintenant actif
3. Surveillez les logs les premiers jours

---

## 📝 Alternatives

### Option 1 : Manager en dehors de N8N

Si vous préférez avoir le Manager dans l'application Next.js :

**Fichier** : `src/lib/manager/router.ts`

```typescript
export async function routeMessage(message: string): Promise<'charlie' | 'leo'> {
  // Mots-clés pour Charlie
  const charlieKeywords = ['devis', 'facture', 'client', 'envoyer', 'relancer', 'paiement']
  
  // Mots-clés pour LÉO
  const leoKeywords = ['rdv', 'planning', 'demain', 'visite', 'dossier', 'stats']
  
  const messageLower = message.toLowerCase()
  
  const charlieScore = charlieKeywords.filter(k => messageLower.includes(k)).length
  const leoScore = leoKeywords.filter(k => messageLower.includes(k)).length
  
  if (charlieScore > leoScore) return 'charlie'
  if (leoScore > charlieScore) return 'leo'
  
  // Par défaut, LÉO (agent terrain plus général)
  return 'leo'
}
```

**Puis modifier** `src/app/api/leo/chat/route.ts` :
```typescript
import { routeMessage } from '@/lib/manager/router'

// Avant d'appeler LÉO
const targetAgent = await routeMessage(message)

if (targetAgent === 'charlie') {
  // Appeler Charlie endpoint
  const response = await fetch(N8N_CHARLIE_ENDPOINT, ...)
} else {
  // Appeler LÉO endpoint
  const response = await mcpClient.chat(...)
}
```

### Option 2 : Manager avec Claude API

Utiliser Claude API directement dans l'app pour le routage :

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function routeWithClaude(message: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Analyse ce message et réponds uniquement "CHARLIE" ou "LEO":
      
      Message: "${message}"
      
      CHARLIE = devis, facture, client, commercial
      LEO = rdv, planning, terrain, dossier`
    }]
  })
  
  return response.content[0].text.includes('CHARLIE') ? 'charlie' : 'leo'
}
```

---

## 🎯 Recommandation

**Option recommandée :** Manager dans N8N (comme décrit ci-dessus)

**Avantages :**
- Centralise toute la logique IA dans N8N
- Facile à monitorer et débugger
- Peut utiliser des outils MCP
- Historique des décisions de routage

**Inconvénients :**
- Ajoute une latence (~200ms)
- Dépend de N8N

---

**Date de création :** 23 janvier 2026  
**Temps estimé d'implémentation :** 2-3 heures  
**Criticité :** 🔴 URGENT - Fonctionnalité clé
