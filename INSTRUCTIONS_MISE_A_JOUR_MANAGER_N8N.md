# 🔧 Instructions : Mise à jour du Manager Agent dans n8n

## 🎯 Problème résolu

Le Manager retournait un JSON au lieu d'appeler directement les outils (agents IA) et de renvoyer leur réponse.

## ✅ Solution

Le Manager doit maintenant :
1. **APPELER directement les outils** (Charlie ou Léo) au lieu de retourner un JSON
2. **RENVOYER la réponse de l'outil** à l'utilisateur (textuellement)
3. **NE JAMAIS retourner de JSON**
4. **NE JAMAIS répondre directement** à l'utilisateur

## 📝 Instructions pour mettre à jour dans n8n

### Étape 1 : Ouvrir le workflow n8n

1. Aller dans n8n
2. Ouvrir le workflow qui contient le nœud "AI Agent" (Manager)
3. Cliquer sur le nœud "AI Agent"

### Étape 2 : Mettre à jour le System Message

1. Dans les paramètres du nœud, trouver le champ "System Message"
2. **Remplacer TOUT le contenu** par le nouveau prompt (voir `PROMPT_MANAGER_AGENT_COMPLET.md`)
3. Le nouveau prompt commence par : `🚨🚨🚨 RÈGLE ABSOLUE : TU APPELES LES OUTILS ET TU RENVOIES LEUR RÉPONSE 🚨🚨🚨`

### Étape 3 : Vérifier les outils connectés

**⚠️ CRITIQUE :** Le Manager doit avoir les deux outils connectés comme "Tools" :

1. Dans les paramètres du nœud "AI Agent", aller dans la section "Tools"
2. Vérifier que les deux outils sont connectés :
   - ✅ **CHARLIE - Agent Commercial & Administratif** (Agent Tool)
   - ✅ **LÉO - Agent Suivi Terrain & Projets** (Agent Tool)

**Si les outils ne sont pas connectés :**
- Cliquer sur "Add Tool"
- Sélectionner "Agent Tool"
- Connecter "CHARLIE - Agent Commercial & Administratif"
- Répéter pour "LÉO - Agent Suivi Terrain & Projets"

### Étape 4 : Modifier la structure du workflow

**AVANT (ancien workflow avec Switch) :**
```
[Chat Trigger]
    ↓
[Manager Agent] → Retourne JSON
    ↓
[Switch] → Route selon JSON
    ├─→ charlie → [AI Agent Charlie]
    ├─→ leo → [AI Agent LÉO]
    └─→ ambiguous → [Code - Response]
```

**APRÈS (nouveau workflow simplifié) :**
```
[Chat Trigger]
    ↓
[Manager Agent] → Appelle directement l'outil (Charlie ou Léo)
    ↓
[Send message] → Renvoie la réponse de l'agent
```

**⚠️ IMPORTANT :** 
- Supprimer le nœud "Switch" (plus nécessaire)
- Le Manager appelle directement les outils et renvoie leur réponse
- Connecter directement "AI Agent" → "Send message"

### Étape 5 : Vérifier les paramètres du nœud

1. **Output Format** : Doit être **Text** (PAS JSON !)
2. **Model** : GPT-4 ou GPT-4 Turbo
3. **Temperature** : 0.1
4. **Tools** : Les deux outils (Charlie et Léo) doivent être connectés

### Étape 6 : Sauvegarder et tester

1. Sauvegarder le workflow n8n
2. Tester avec : "envoi a samira sont devis par email"
3. Vérifier que :
   - ✅ Le Manager appelle directement Charlie (pas de JSON)
   - ✅ Charlie cherche automatiquement "Samira" et trouve son email
   - ✅ Charlie envoie le devis
   - ✅ Le Manager renvoie la réponse de Charlie à l'utilisateur

## 📋 Checklist

- [ ] System Message mis à jour avec le nouveau prompt
- [ ] Les deux outils (Charlie et Léo) sont connectés comme "Tools"
- [ ] Output Format = Text (pas JSON)
- [ ] Le nœud Switch a été supprimé (si présent)
- [ ] Le workflow va directement de "AI Agent" → "Send message"
- [ ] Workflow sauvegardé
- [ ] Test effectué avec "envoi a samira sont devis par email"
- [ ] Le Manager appelle directement les outils (pas de JSON)
- [ ] Le Manager renvoie la réponse de l'agent à l'utilisateur

## 🎯 Résultat attendu

Quand l'utilisateur dit "envoi a samira sont devis par email" :

1. ✅ Le Manager analyse le message
2. ✅ Le Manager identifie : "devis" + "envoyer" → Charlie
3. ✅ Le Manager **APPELLE directement** l'outil "CHARLIE - Agent Commercial & Administratif"
4. ✅ Charlie :
   - Cherche automatiquement "Samira" avec `search-client`
   - Trouve Samira Bouzid avec email aslambekdaoud@gmail.com
   - Cherche les devis avec `list-devis`
   - Trouve le devis DV-2026-0001
   - Envoie le devis avec `envoyer-devis`
   - Renvoie sa réponse au Manager
5. ✅ Le Manager **RENVOIE la réponse de Charlie** à l'utilisateur (textuellement)

**Aucun JSON ne doit être retourné !**

## ⚠️ Erreurs courantes à éviter

1. **Retourner un JSON** au lieu d'appeler l'outil
2. **Répondre directement** à l'utilisateur au lieu d'appeler l'outil
3. **Oublier de connecter les outils** comme "Tools" dans le nœud AI Agent
4. **Garder le nœud Switch** (plus nécessaire si le Manager appelle directement les outils)
5. **Mettre Output Format = JSON** (doit être Text)

## 🔍 Vérification

Pour vérifier que ça fonctionne :

1. Envoyer : "envoi a samira sont devis par email"
2. Vérifier dans les logs n8n que :
   - Le Manager a appelé l'outil "CHARLIE - Agent Commercial & Administratif"
   - Charlie a appelé `search-client` avec "samira"
   - Charlie a appelé `list-devis` avec "samira"
   - Charlie a appelé `envoyer-devis` avec le devis trouvé
   - Le Manager a renvoyé la réponse de Charlie à l'utilisateur
3. L'utilisateur doit recevoir la réponse de Charlie directement, sans JSON

---

**Date de mise à jour :** 25 janvier 2026
