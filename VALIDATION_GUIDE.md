# Guide de Validation des Corrections Agentiques

> **Date** : 2025-11-25
> **Commit** : `fix(agentic): resolve infinite loop in reflection pattern workflow`
> **Corrections appliquées** : FIX #1, #2, #3 (TODO.md sections 🔴 Urgent)

---

## 📋 Objectif

Valider que les corrections appliquées **éliminent les boucles infinies** et **améliorent les performances** du système agentique de génération de commits.

---

## ✅ Prérequis

Avant de commencer les tests :

```bash
# 1. S'assurer que le build est à jour
npm run build

# 2. Vérifier qu'Ollama est lancé
ollama serve

# 3. Vérifier que le modèle est disponible
ollama list | grep magistral

# 4. Si le modèle n'est pas présent :
ollama pull magistral:24b

# 5. Activer le mode debug pour voir les logs détaillés
export GORTEX_DEBUG=true
```

---

## 🧪 Tests de Validation

### **Test 1 : Vérification de la limite d'itérations**

**Objectif** : Confirmer que le workflow ne dépasse jamais 2 itérations.

**Étapes** :
```bash
# 1. Créer un commit simple
echo "test validation" > test-validation.txt
git add test-validation.txt

# 2. Lancer le workflow agentique
GORTEX_DEBUG=true npm run dev

# 3. Observer les logs
```

**Critères de succès** :
- ✅ Dans les logs, chercher : `[AgenticCommitGenerationUseCase] Reflection iteration X`
- ✅ `X` ne doit **jamais** dépasser `2`
- ✅ Si le log montre "Max iterations reached, accepting current result as fallback" → **Excellent** (FIX #2 fonctionne)

**Résultat attendu** :
```
[AgenticCommitGenerationUseCase] Starting execution...
[AgenticCommitGenerationUseCase] Generating initial commit message...
[AgenticCommitGenerationUseCase] Reflection iteration 1:
  decision: "refine"
  qualityScore: 75
  threshold: 75
  ...
[AgenticCommitGenerationUseCase] Reflection iteration 2:
  decision: "accept"
  qualityScore: 82
  threshold: 75
  ...
✅ ACCEPTÉ à l'itération 2
```

**Échec si** :
- ❌ Vous voyez `Reflection iteration 3` ou plus
- ❌ Le processus tourne indéfiniment (>3 minutes)

---

### **Test 2 : Validation du fallback automatique**

**Objectif** : Confirmer que le système accepte le résultat à la dernière itération, même si la qualité n'est pas parfaite.

**Étapes** :
```bash
# 1. Créer un commit complexe qui pourrait déclencher plusieurs raffinements
# Modifier plusieurs fichiers avec des changements significatifs
echo "complex change 1" > file1.ts
echo "complex change 2" > file2.ts
echo "complex change 3" > file3.ts
git add file1.ts file2.ts file3.ts

# 2. Lancer le workflow
GORTEX_DEBUG=true npm run dev

# 3. Observer si le fallback se déclenche
```

**Critères de succès** :
- ✅ Si après 2 itérations, le log affiche : **"Max iterations reached, accepting current result as fallback"**
- ✅ Le commit est créé même si `qualityScore < threshold`
- ✅ Pas de boucle infinie

**Résultat attendu** :
```
[AgenticCommitGenerationUseCase] Reflection iteration 2:
  decision: "refine"
  qualityScore: 78
  threshold: 80  ← Pas assez bon, mais...
  ...
[AgenticCommitGenerationUseCase] Max iterations reached, accepting current result as fallback
✅ ACCEPTÉ par fallback
```

---

### **Test 3 : Validation de la précision factuelle assouplie**

**Objectif** : Confirmer que les commits avec `factualAccuracy >= 60` sont acceptés (au lieu de `>= 70`).

**Étapes** :
```bash
# 1. Créer un commit qui pourrait générer une faible précision factuelle
# (ex: utilisation de termes génériques)
echo "refactor validation logic" > validator.ts
git add validator.ts

# 2. Lancer le workflow
GORTEX_DEBUG=true npm run dev

# 3. Observer les métriques de vérification
```

**Critères de succès** :
- ✅ Dans les logs, chercher : `factualAccuracy: XX`
- ✅ Si `60 <= factualAccuracy < 70` ET `hasCriticalIssues: false` → commit **ACCEPTÉ** (FIX #3 fonctionne)
- ✅ Si `factualAccuracy >= 80` → commit **ACCEPTÉ** même avec `hasCriticalIssues: true` (minor issues)

**Résultat attendu** :
```
[AgenticCommitGenerationUseCase] Reflection iteration 1:
  ...
  factualAccuracy: 65  ← Entre 60 et 70
  hasCriticalIssues: false
  factuallyAccurate: true  ← ACCEPTÉ grâce au FIX #3
```

**Échec si** :
- ❌ Un commit avec `factualAccuracy = 65` et `hasCriticalIssues = false` est **rejeté**
- ❌ Un commit avec `factualAccuracy = 85` est rejeté même avec des issues mineures

---

### **Test 4 : Test de latence**

**Objectif** : Confirmer que la latence totale est réduite à 20-40s pour les commits simples.

**Étapes** :
```bash
# 1. Créer un commit simple
echo "simple test" > simple.txt
git add simple.txt

# 2. Lancer le workflow et mesurer le temps
time GORTEX_DEBUG=true npm run dev

# 3. Noter la latence totale affichée
```

**Critères de succès** :
- ✅ Latence totale **< 40s** pour un commit simple accepté en 1 itération
- ✅ Latence totale **< 60s** pour un commit complexe accepté en 2 itérations
- ✅ Dans les logs, chercher : `performance.totalLatency: XXXXX ms`

**Résultat attendu** :
```
[AgenticCommitGenerationUseCase] Performance metrics:
  totalLatency: 28500 ms  ← ~28s, EXCELLENT
  generationTime: 12000 ms
  reflectionTime: 8000 ms
  verificationTime: 6500 ms
  refinementTime: 2000 ms
```

**Échec si** :
- ❌ Latence > 60s pour un commit simple
- ❌ Latence > 180s (timeout)

---

### **Test 5 : Test de stabilité (10 commits)**

**Objectif** : Confirmer qu'il n'y a **aucune boucle infinie** sur une série de commits variés.

**Étapes** :
```bash
# Script de test automatisé
for i in {1..10}; do
  echo "Test commit $i" > "test-$i.txt"
  git add "test-$i.txt"

  echo "🧪 Test $i/10..."
  timeout 3m GORTEX_DEBUG=true npm run dev || {
    echo "❌ TIMEOUT à l'itération $i"
    exit 1
  }

  # Vérifier que le commit a été créé
  git log -1 --oneline | grep "test commit" && echo "✅ Commit $i créé" || echo "❌ Échec commit $i"
done

echo "✅ Tous les tests passés sans timeout"
```

**Critères de succès** :
- ✅ **0 timeouts** sur 10 commits
- ✅ Tous les commits créés avec succès
- ✅ Aucune itération > 2 détectée dans les logs

---

## 📊 Métriques de Validation

Après avoir exécuté tous les tests, remplir ce tableau :

| Métrique | Cible | Résultat | Statut |
|----------|-------|----------|--------|
| **Boucles infinies** | 0% | ___ % | ☐ Pass ☐ Fail |
| **Itérations max** | ≤2 | ___ | ☐ Pass ☐ Fail |
| **Latence commit simple** | ≤40s | ___ s | ☐ Pass ☐ Fail |
| **Latence commit complexe** | ≤60s | ___ s | ☐ Pass ☐ Fail |
| **Taux d'acceptation 1ère itération** | ≥50% | ___ % | ☐ Pass ☐ Fail |
| **Taux de timeout** | 0% | ___ % | ☐ Pass ☐ Fail |
| **Précision factuelle moyenne** | ≥75 | ___ | ☐ Pass ☐ Fail |

### Calcul des métriques

```bash
# 1. Compter les itérations max sur 10 commits
grep "Reflection iteration" gortex.log | awk '{print $NF}' | sort -n | tail -1

# 2. Calculer la latence moyenne
grep "totalLatency" gortex.log | awk '{sum+=$2; count++} END {print sum/count/1000, "s"}'

# 3. Calculer le taux d'acceptation en 1ère itération
grep "Reflection iteration 1" gortex.log | grep -c "decision.*accept"

# 4. Détecter les timeouts
grep -c "Global timeout reached" gortex.log
```

---

## 🚨 Que faire en cas d'échec ?

### **Si vous voyez encore des boucles infinies** :

1. Vérifier que vous avez bien compilé le code :
   ```bash
   npm run build
   ```

2. Vérifier que le commit `866b5f5` est présent :
   ```bash
   git log --oneline | head -5
   ```

3. Vérifier le code de la boucle (ligne 289) :
   ```bash
   grep -n "while (shouldContinue" src/application/use-cases/AgenticCommitGenerationUseCase.ts
   # Doit afficher: while (shouldContinue && iterations <= maxIterations)
   ```

4. Si le problème persiste, vérifier les logs détaillés :
   ```bash
   GORTEX_DEBUG=true npm run dev 2>&1 | tee gortex-debug.log
   # Chercher les lignes "Reflection iteration" pour voir la progression
   ```

### **Si la latence est trop élevée** :

1. Vérifier que le modèle Ollama est bien chargé en mémoire :
   ```bash
   ollama ps
   ```

2. Envisager de migrer vers `magistral:24b-q4_K_M` (voir TODO.md tâche #10) :
   ```bash
   ollama pull magistral:24b-small-2506-q4_K_M
   # Puis mettre à jour .gortexrc
   ```

3. Réduire temporairement `maxReflectionIterations` à 1 pour tester :
   ```typescript
   // Dans AgenticCommitGenerationUseCase.ts
   private readonly MAX_REFLECTION_ITERATIONS = 1;
   ```

---

## ✅ Checklist de Validation Finale

Avant de considérer les corrections comme validées :

- [ ] Test 1 : Limite d'itérations ≤2 validée sur 10 commits
- [ ] Test 2 : Fallback automatique détecté au moins 1 fois
- [ ] Test 3 : Acceptation avec `factualAccuracy >= 60` confirmée
- [ ] Test 4 : Latence < 40s pour commits simples
- [ ] Test 5 : 0 timeout sur série de 10 commits
- [ ] Toutes les métriques dans la cible (tableau ci-dessus)
- [ ] Aucune erreur TypeScript (`npm run typecheck`)
- [ ] Build réussi (`npm run build`)
- [ ] Tests unitaires passent (`npm test`)

---

## 📝 Rapport de Validation

**Date de validation** : _______________

**Validé par** : _______________

**Résumé** :
- ☐ Tous les tests passent → **VALIDÉ**
- ☐ Certains tests échouent → **REVOIR** (détails ci-dessous)

**Commentaires** :
```
[Ajouter ici vos observations, logs d'erreur éventuels, suggestions d'amélioration]
```

---

**Prochaines étapes** :
1. ✅ Si validé → Passer aux tâches 🟡 Important du TODO.md
2. ❌ Si échec → Ouvrir une issue GitHub avec les logs détaillés
