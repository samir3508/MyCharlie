# 📋 INSTRUCTIONS : Où copier le code dans N8N

## 🎯 FICHIER À UTILISER

**Utilisez ce fichier :** `N8N_CODE_COMPLET_A_COPIER.txt` ⚠️ **Ce fichier commence bien par `const input = $input.item.json;`**

---

## 📍 ÉTAPE 1 : OUVRIR LE CUSTOM TOOL DANS N8N

1. Ouvrez votre workflow N8N
2. Trouvez le nœud **"Code Tool"** (ou **"Custom Tool"**) nommé **"call_edge_function"**
3. Cliquez dessus pour l'éditer

---

## 📍 ÉTAPE 2 : COPIER LE CODE JAVASCRIPT

1. Ouvrez le fichier **`N8N_CODE_A_COPIER_MAINTENANT.txt`**
2. **Sélectionnez TOUT le contenu** (Cmd+A sur Mac ou Ctrl+A sur Windows)
3. **Copiez** (Cmd+C ou Ctrl+C)
4. Dans N8N, dans le nœud "Code Tool", trouvez la section **"Code"** ou **"JavaScript"**
5. **Supprimez tout l'ancien code**
6. **Collez le nouveau code** (Cmd+V ou Ctrl+V)

---

## 📍 ÉTAPE 3 : CONFIGURER LE SCHÉMA INPUT

1. Dans le même nœud "Code Tool", trouvez la section **"Input Schema"** ou **"Schema"**
2. **Collez ceci exactement :**

```json
{
  "type": "object",
  "additionalProperties": true
}
```

**C'est tout !** Ce schéma accepte n'importe quelle structure JSON, donc ça fonctionnera avec tous les formats générés par l'IA.

---

## 📍 ÉTAPE 4 : SAUVEGARDER ET TESTER

1. Cliquez sur **"Save"** ou **"✓"** dans N8N
2. Testez votre workflow avec un message de devis
3. Si ça ne marche pas, utilisez `N8N_CODE_AVEC_DEBUG.txt` pour voir les logs

---

## 🔍 EN CAS DE PROBLÈME

Si vous avez encore l'erreur "Structure inattendue" :

1. Utilisez le fichier **`N8N_CODE_AVEC_DEBUG.txt`** à la place
2. Les logs vous montreront exactement ce que reçoit le code
3. Regardez la console N8N pour voir les messages de debug

---

## ✅ RÉSUMÉ RAPIDE

1. **Code JavaScript** → Copier depuis `N8N_CODE_A_COPIER_MAINTENANT.txt`
2. **Input Schema** → `{ "type": "object", "additionalProperties": true }`
3. **Tester** → Exécuter le workflow

C'est tout ! 🎉


## 🎯 FICHIER À UTILISER

**Utilisez ce fichier :** `N8N_CODE_COMPLET_A_COPIER.txt` ⚠️ **Ce fichier commence bien par `const input = $input.item.json;`**

---

## 📍 ÉTAPE 1 : OUVRIR LE CUSTOM TOOL DANS N8N

1. Ouvrez votre workflow N8N
2. Trouvez le nœud **"Code Tool"** (ou **"Custom Tool"**) nommé **"call_edge_function"**
3. Cliquez dessus pour l'éditer

---

## 📍 ÉTAPE 2 : COPIER LE CODE JAVASCRIPT

1. Ouvrez le fichier **`N8N_CODE_A_COPIER_MAINTENANT.txt`**
2. **Sélectionnez TOUT le contenu** (Cmd+A sur Mac ou Ctrl+A sur Windows)
3. **Copiez** (Cmd+C ou Ctrl+C)
4. Dans N8N, dans le nœud "Code Tool", trouvez la section **"Code"** ou **"JavaScript"**
5. **Supprimez tout l'ancien code**
6. **Collez le nouveau code** (Cmd+V ou Ctrl+V)

---

## 📍 ÉTAPE 3 : CONFIGURER LE SCHÉMA INPUT

1. Dans le même nœud "Code Tool", trouvez la section **"Input Schema"** ou **"Schema"**
2. **Collez ceci exactement :**

```json
{
  "type": "object",
  "additionalProperties": true
}
```

**C'est tout !** Ce schéma accepte n'importe quelle structure JSON, donc ça fonctionnera avec tous les formats générés par l'IA.

---

## 📍 ÉTAPE 4 : SAUVEGARDER ET TESTER

1. Cliquez sur **"Save"** ou **"✓"** dans N8N
2. Testez votre workflow avec un message de devis
3. Si ça ne marche pas, utilisez `N8N_CODE_AVEC_DEBUG.txt` pour voir les logs

---

## 🔍 EN CAS DE PROBLÈME

Si vous avez encore l'erreur "Structure inattendue" :

1. Utilisez le fichier **`N8N_CODE_AVEC_DEBUG.txt`** à la place
2. Les logs vous montreront exactement ce que reçoit le code
3. Regardez la console N8N pour voir les messages de debug

---

## ✅ RÉSUMÉ RAPIDE

1. **Code JavaScript** → Copier depuis `N8N_CODE_A_COPIER_MAINTENANT.txt`
2. **Input Schema** → `{ "type": "object", "additionalProperties": true }`
3. **Tester** → Exécuter le workflow

C'est tout ! 🎉

## 🎯 FICHIER À UTILISER

**Utilisez ce fichier :** `N8N_CODE_COMPLET_A_COPIER.txt` ⚠️ **Ce fichier commence bien par `const input = $input.item.json;`**

---

## 📍 ÉTAPE 1 : OUVRIR LE CUSTOM TOOL DANS N8N

1. Ouvrez votre workflow N8N
2. Trouvez le nœud **"Code Tool"** (ou **"Custom Tool"**) nommé **"call_edge_function"**
3. Cliquez dessus pour l'éditer

---

## 📍 ÉTAPE 2 : COPIER LE CODE JAVASCRIPT

1. Ouvrez le fichier **`N8N_CODE_A_COPIER_MAINTENANT.txt`**
2. **Sélectionnez TOUT le contenu** (Cmd+A sur Mac ou Ctrl+A sur Windows)
3. **Copiez** (Cmd+C ou Ctrl+C)
4. Dans N8N, dans le nœud "Code Tool", trouvez la section **"Code"** ou **"JavaScript"**
5. **Supprimez tout l'ancien code**
6. **Collez le nouveau code** (Cmd+V ou Ctrl+V)

---

## 📍 ÉTAPE 3 : CONFIGURER LE SCHÉMA INPUT

1. Dans le même nœud "Code Tool", trouvez la section **"Input Schema"** ou **"Schema"**
2. **Collez ceci exactement :**

```json
{
  "type": "object",
  "additionalProperties": true
}
```

**C'est tout !** Ce schéma accepte n'importe quelle structure JSON, donc ça fonctionnera avec tous les formats générés par l'IA.

---

## 📍 ÉTAPE 4 : SAUVEGARDER ET TESTER

1. Cliquez sur **"Save"** ou **"✓"** dans N8N
2. Testez votre workflow avec un message de devis
3. Si ça ne marche pas, utilisez `N8N_CODE_AVEC_DEBUG.txt` pour voir les logs

---

## 🔍 EN CAS DE PROBLÈME

Si vous avez encore l'erreur "Structure inattendue" :

1. Utilisez le fichier **`N8N_CODE_AVEC_DEBUG.txt`** à la place
2. Les logs vous montreront exactement ce que reçoit le code
3. Regardez la console N8N pour voir les messages de debug

---

## ✅ RÉSUMÉ RAPIDE

1. **Code JavaScript** → Copier depuis `N8N_CODE_A_COPIER_MAINTENANT.txt`
2. **Input Schema** → `{ "type": "object", "additionalProperties": true }`
3. **Tester** → Exécuter le workflow

C'est tout ! 🎉


## 🎯 FICHIER À UTILISER

**Utilisez ce fichier :** `N8N_CODE_COMPLET_A_COPIER.txt` ⚠️ **Ce fichier commence bien par `const input = $input.item.json;`**

---

## 📍 ÉTAPE 1 : OUVRIR LE CUSTOM TOOL DANS N8N

1. Ouvrez votre workflow N8N
2. Trouvez le nœud **"Code Tool"** (ou **"Custom Tool"**) nommé **"call_edge_function"**
3. Cliquez dessus pour l'éditer

---

## 📍 ÉTAPE 2 : COPIER LE CODE JAVASCRIPT

1. Ouvrez le fichier **`N8N_CODE_A_COPIER_MAINTENANT.txt`**
2. **Sélectionnez TOUT le contenu** (Cmd+A sur Mac ou Ctrl+A sur Windows)
3. **Copiez** (Cmd+C ou Ctrl+C)
4. Dans N8N, dans le nœud "Code Tool", trouvez la section **"Code"** ou **"JavaScript"**
5. **Supprimez tout l'ancien code**
6. **Collez le nouveau code** (Cmd+V ou Ctrl+V)

---

## 📍 ÉTAPE 3 : CONFIGURER LE SCHÉMA INPUT

1. Dans le même nœud "Code Tool", trouvez la section **"Input Schema"** ou **"Schema"**
2. **Collez ceci exactement :**

```json
{
  "type": "object",
  "additionalProperties": true
}
```

**C'est tout !** Ce schéma accepte n'importe quelle structure JSON, donc ça fonctionnera avec tous les formats générés par l'IA.

---

## 📍 ÉTAPE 4 : SAUVEGARDER ET TESTER

1. Cliquez sur **"Save"** ou **"✓"** dans N8N
2. Testez votre workflow avec un message de devis
3. Si ça ne marche pas, utilisez `N8N_CODE_AVEC_DEBUG.txt` pour voir les logs

---

## 🔍 EN CAS DE PROBLÈME

Si vous avez encore l'erreur "Structure inattendue" :

1. Utilisez le fichier **`N8N_CODE_AVEC_DEBUG.txt`** à la place
2. Les logs vous montreront exactement ce que reçoit le code
3. Regardez la console N8N pour voir les messages de debug

---

## ✅ RÉSUMÉ RAPIDE

1. **Code JavaScript** → Copier depuis `N8N_CODE_A_COPIER_MAINTENANT.txt`
2. **Input Schema** → `{ "type": "object", "additionalProperties": true }`
3. **Tester** → Exécuter le workflow

C'est tout ! 🎉

## 🎯 FICHIER À UTILISER

**Utilisez ce fichier :** `N8N_CODE_COMPLET_A_COPIER.txt` ⚠️ **Ce fichier commence bien par `const input = $input.item.json;`**

---

## 📍 ÉTAPE 1 : OUVRIR LE CUSTOM TOOL DANS N8N

1. Ouvrez votre workflow N8N
2. Trouvez le nœud **"Code Tool"** (ou **"Custom Tool"**) nommé **"call_edge_function"**
3. Cliquez dessus pour l'éditer

---

## 📍 ÉTAPE 2 : COPIER LE CODE JAVASCRIPT

1. Ouvrez le fichier **`N8N_CODE_A_COPIER_MAINTENANT.txt`**
2. **Sélectionnez TOUT le contenu** (Cmd+A sur Mac ou Ctrl+A sur Windows)
3. **Copiez** (Cmd+C ou Ctrl+C)
4. Dans N8N, dans le nœud "Code Tool", trouvez la section **"Code"** ou **"JavaScript"**
5. **Supprimez tout l'ancien code**
6. **Collez le nouveau code** (Cmd+V ou Ctrl+V)

---

## 📍 ÉTAPE 3 : CONFIGURER LE SCHÉMA INPUT

1. Dans le même nœud "Code Tool", trouvez la section **"Input Schema"** ou **"Schema"**
2. **Collez ceci exactement :**

```json
{
  "type": "object",
  "additionalProperties": true
}
```

**C'est tout !** Ce schéma accepte n'importe quelle structure JSON, donc ça fonctionnera avec tous les formats générés par l'IA.

---

## 📍 ÉTAPE 4 : SAUVEGARDER ET TESTER

1. Cliquez sur **"Save"** ou **"✓"** dans N8N
2. Testez votre workflow avec un message de devis
3. Si ça ne marche pas, utilisez `N8N_CODE_AVEC_DEBUG.txt` pour voir les logs

---

## 🔍 EN CAS DE PROBLÈME

Si vous avez encore l'erreur "Structure inattendue" :

1. Utilisez le fichier **`N8N_CODE_AVEC_DEBUG.txt`** à la place
2. Les logs vous montreront exactement ce que reçoit le code
3. Regardez la console N8N pour voir les messages de debug

---

## ✅ RÉSUMÉ RAPIDE

1. **Code JavaScript** → Copier depuis `N8N_CODE_A_COPIER_MAINTENANT.txt`
2. **Input Schema** → `{ "type": "object", "additionalProperties": true }`
3. **Tester** → Exécuter le workflow

C'est tout ! 🎉


## 🎯 FICHIER À UTILISER

**Utilisez ce fichier :** `N8N_CODE_COMPLET_A_COPIER.txt` ⚠️ **Ce fichier commence bien par `const input = $input.item.json;`**

---

## 📍 ÉTAPE 1 : OUVRIR LE CUSTOM TOOL DANS N8N

1. Ouvrez votre workflow N8N
2. Trouvez le nœud **"Code Tool"** (ou **"Custom Tool"**) nommé **"call_edge_function"**
3. Cliquez dessus pour l'éditer

---

## 📍 ÉTAPE 2 : COPIER LE CODE JAVASCRIPT

1. Ouvrez le fichier **`N8N_CODE_A_COPIER_MAINTENANT.txt`**
2. **Sélectionnez TOUT le contenu** (Cmd+A sur Mac ou Ctrl+A sur Windows)
3. **Copiez** (Cmd+C ou Ctrl+C)
4. Dans N8N, dans le nœud "Code Tool", trouvez la section **"Code"** ou **"JavaScript"**
5. **Supprimez tout l'ancien code**
6. **Collez le nouveau code** (Cmd+V ou Ctrl+V)

---

## 📍 ÉTAPE 3 : CONFIGURER LE SCHÉMA INPUT

1. Dans le même nœud "Code Tool", trouvez la section **"Input Schema"** ou **"Schema"**
2. **Collez ceci exactement :**

```json
{
  "type": "object",
  "additionalProperties": true
}
```

**C'est tout !** Ce schéma accepte n'importe quelle structure JSON, donc ça fonctionnera avec tous les formats générés par l'IA.

---

## 📍 ÉTAPE 4 : SAUVEGARDER ET TESTER

1. Cliquez sur **"Save"** ou **"✓"** dans N8N
2. Testez votre workflow avec un message de devis
3. Si ça ne marche pas, utilisez `N8N_CODE_AVEC_DEBUG.txt` pour voir les logs

---

## 🔍 EN CAS DE PROBLÈME

Si vous avez encore l'erreur "Structure inattendue" :

1. Utilisez le fichier **`N8N_CODE_AVEC_DEBUG.txt`** à la place
2. Les logs vous montreront exactement ce que reçoit le code
3. Regardez la console N8N pour voir les messages de debug

---

## ✅ RÉSUMÉ RAPIDE

1. **Code JavaScript** → Copier depuis `N8N_CODE_A_COPIER_MAINTENANT.txt`
2. **Input Schema** → `{ "type": "object", "additionalProperties": true }`
3. **Tester** → Exécuter le workflow

C'est tout ! 🎉

## 🎯 FICHIER À UTILISER

**Utilisez ce fichier :** `N8N_CODE_COMPLET_A_COPIER.txt` ⚠️ **Ce fichier commence bien par `const input = $input.item.json;`**

---

## 📍 ÉTAPE 1 : OUVRIR LE CUSTOM TOOL DANS N8N

1. Ouvrez votre workflow N8N
2. Trouvez le nœud **"Code Tool"** (ou **"Custom Tool"**) nommé **"call_edge_function"**
3. Cliquez dessus pour l'éditer

---

## 📍 ÉTAPE 2 : COPIER LE CODE JAVASCRIPT

1. Ouvrez le fichier **`N8N_CODE_A_COPIER_MAINTENANT.txt`**
2. **Sélectionnez TOUT le contenu** (Cmd+A sur Mac ou Ctrl+A sur Windows)
3. **Copiez** (Cmd+C ou Ctrl+C)
4. Dans N8N, dans le nœud "Code Tool", trouvez la section **"Code"** ou **"JavaScript"**
5. **Supprimez tout l'ancien code**
6. **Collez le nouveau code** (Cmd+V ou Ctrl+V)

---

## 📍 ÉTAPE 3 : CONFIGURER LE SCHÉMA INPUT

1. Dans le même nœud "Code Tool", trouvez la section **"Input Schema"** ou **"Schema"**
2. **Collez ceci exactement :**

```json
{
  "type": "object",
  "additionalProperties": true
}
```

**C'est tout !** Ce schéma accepte n'importe quelle structure JSON, donc ça fonctionnera avec tous les formats générés par l'IA.

---

## 📍 ÉTAPE 4 : SAUVEGARDER ET TESTER

1. Cliquez sur **"Save"** ou **"✓"** dans N8N
2. Testez votre workflow avec un message de devis
3. Si ça ne marche pas, utilisez `N8N_CODE_AVEC_DEBUG.txt` pour voir les logs

---

## 🔍 EN CAS DE PROBLÈME

Si vous avez encore l'erreur "Structure inattendue" :

1. Utilisez le fichier **`N8N_CODE_AVEC_DEBUG.txt`** à la place
2. Les logs vous montreront exactement ce que reçoit le code
3. Regardez la console N8N pour voir les messages de debug

---

## ✅ RÉSUMÉ RAPIDE

1. **Code JavaScript** → Copier depuis `N8N_CODE_A_COPIER_MAINTENANT.txt`
2. **Input Schema** → `{ "type": "object", "additionalProperties": true }`
3. **Tester** → Exécuter le workflow

C'est tout ! 🎉


## 🎯 FICHIER À UTILISER

**Utilisez ce fichier :** `N8N_CODE_COMPLET_A_COPIER.txt` ⚠️ **Ce fichier commence bien par `const input = $input.item.json;`**

---

## 📍 ÉTAPE 1 : OUVRIR LE CUSTOM TOOL DANS N8N

1. Ouvrez votre workflow N8N
2. Trouvez le nœud **"Code Tool"** (ou **"Custom Tool"**) nommé **"call_edge_function"**
3. Cliquez dessus pour l'éditer

---

## 📍 ÉTAPE 2 : COPIER LE CODE JAVASCRIPT

1. Ouvrez le fichier **`N8N_CODE_A_COPIER_MAINTENANT.txt`**
2. **Sélectionnez TOUT le contenu** (Cmd+A sur Mac ou Ctrl+A sur Windows)
3. **Copiez** (Cmd+C ou Ctrl+C)
4. Dans N8N, dans le nœud "Code Tool", trouvez la section **"Code"** ou **"JavaScript"**
5. **Supprimez tout l'ancien code**
6. **Collez le nouveau code** (Cmd+V ou Ctrl+V)

---

## 📍 ÉTAPE 3 : CONFIGURER LE SCHÉMA INPUT

1. Dans le même nœud "Code Tool", trouvez la section **"Input Schema"** ou **"Schema"**
2. **Collez ceci exactement :**

```json
{
  "type": "object",
  "additionalProperties": true
}
```

**C'est tout !** Ce schéma accepte n'importe quelle structure JSON, donc ça fonctionnera avec tous les formats générés par l'IA.

---

## 📍 ÉTAPE 4 : SAUVEGARDER ET TESTER

1. Cliquez sur **"Save"** ou **"✓"** dans N8N
2. Testez votre workflow avec un message de devis
3. Si ça ne marche pas, utilisez `N8N_CODE_AVEC_DEBUG.txt` pour voir les logs

---

## 🔍 EN CAS DE PROBLÈME

Si vous avez encore l'erreur "Structure inattendue" :

1. Utilisez le fichier **`N8N_CODE_AVEC_DEBUG.txt`** à la place
2. Les logs vous montreront exactement ce que reçoit le code
3. Regardez la console N8N pour voir les messages de debug

---

## ✅ RÉSUMÉ RAPIDE

1. **Code JavaScript** → Copier depuis `N8N_CODE_A_COPIER_MAINTENANT.txt`
2. **Input Schema** → `{ "type": "object", "additionalProperties": true }`
3. **Tester** → Exécuter le workflow

C'est tout ! 🎉