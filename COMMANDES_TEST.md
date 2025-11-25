# 🚀 Commandes de Test - Workflow Agentique

## ✅ Configuration créée

Le fichier `.gortexrc` a été créé avec :
- **Modèle** : `magistral:24b-small-2506-q4_K_M` (optimisé q4, +35% vitesse)
- **Provider** : Ollama (local)
- **Timeout** : 120s
- **Temperature** : 0.3 (précis)

---

## 🧪 Commande de Test Interactive (MODE DEBUG)

### Commande complète :

```bash
GORTEX_DEBUG=true npm run dev
```

**OU** si vous voulez utiliser le binaire compilé :

```bash
GORTEX_DEBUG=true node dist/index.js commit
```

---

## 📊 Ce que vous allez voir

### 1. **Écran de sélection de branche**
- Utilisez les flèches ↑/↓ pour sélectionner la branche
- Appuyez sur **Enter** pour valider

### 2. **Sélection des fichiers à stager**
- Cochez les fichiers avec **Espace**
- Fichiers déjà stagés : `test-validation-fix.txt`, `VALIDATION_GUIDE.md`
- Appuyez sur **Enter** pour valider

### 3. **Aperçu du diff**
- Vérifiez les changements
- Appuyez sur **Enter** pour continuer

### 4. **🤖 Workflow Agentique (Phase critique)**
Vous verrez dans le terminal :

```
🤖 Mode Agentique (Reflection Pattern)
⭐ Génération initiale du message...
```

**OBSERVEZ LES LOGS DEBUG** (très important !) :

```
[AgenticCommitGenerationUseCase] Starting execution...
[AgenticCommitGenerationUseCase] Generating initial commit message...
[AgenticCommitGenerationUseCase] Reflection iteration 1:
  decision: "refine" ou "accept"
  qualityScore: 85
  threshold: 75
  qualityAcceptable: true
  factualAccuracy: 70
  hasCriticalIssues: false
  factuallyAccurate: true
```

### 5. **Métriques à surveiller**

#### ✅ **FIX #1 : Limite d'itérations**
Cherchez dans les logs :
```
[AgenticCommitGenerationUseCase] Reflection iteration 1:
[AgenticCommitGenerationUseCase] Reflection iteration 2:
```
**CRITÈRE** : Vous ne devez **JAMAIS** voir `iteration 3` ou plus.

#### ✅ **FIX #2 : Fallback automatique**
Si après 2 itérations, le système n'a pas accepté, vous verrez :
```
[AgenticCommitGenerationUseCase] Max iterations reached, accepting current result as fallback
```
**CRITÈRE** : Le commit est créé même si `qualityScore < threshold`.

#### ✅ **FIX #3 : Précision factuelle assouplie**
Cherchez :
```
factualAccuracy: 65  ← Entre 60 et 80
hasCriticalIssues: false
factuallyAccurate: true  ← ACCEPTÉ grâce au FIX #3
```
**CRITÈRE** : Acceptation si `factualAccuracy >= 60` (au lieu de `>= 70`).

### 6. **Résultat final**

Vous verrez une boîte avec :
```
╭─────────────────────────────────────────────────────╮
│ 🤖 Suggestion AI (Ollama)                           │
├─────────────────────────────────────────────────────┤
│ Message de commit proposé:                          │
│ docs(validation): add test validation files         │
│                                                      │
│ Confiance: 85%                                       │
├─────────────────────────────────────────────────────┤
│ ⭐ Métadonnées Agentiques                            │
│ ✓ Itérations: 2 (raffiné)                          │
│ ✓ Score qualité: 85/100                            │
│ ✓ Précision factuelle: 70/100                      │
│ ✓ Temps total: 28.5s                               │
│   - Génération: 12.0s                               │
│   - Réflexion: 8.0s                                 │
│   - Vérification: 6.5s                              │
│   - Raffinement: 2.0s                               │
╰─────────────────────────────────────────────────────╯
```

### 7. **Confirmation**
- Tapez `y` (yes) ou `n` (no)
- Si `y`, le commit est créé

---

## 🎯 Checklist de Validation

Pendant le test, vérifiez :

- [ ] **Pas de boucle infinie** : Le processus se termine en < 3 minutes
- [ ] **Itérations max = 2** : Jamais de `iteration 3` dans les logs
- [ ] **Fallback détecté** : Message "Max iterations reached" si besoin
- [ ] **Latence acceptable** : Temps total < 60s
- [ ] **Commit créé** : Message affiché et commit créé si vous validez

---

## 📋 Commandes Complémentaires

### Vérifier le commit créé :
```bash
git log -1 --oneline
```

### Voir les logs détaillés après le test :
```bash
# Si vous avez capturé les logs
cat gortex-debug.log | grep "Reflection iteration"
```

### Mesurer la performance :
```bash
time GORTEX_DEBUG=true npm run dev
```

### Tester plusieurs fois (boucle) :
```bash
for i in {1..3}; do
  echo "Test $i/3"
  echo "test $i" > "test-$i.txt"
  git add "test-$i.txt"
  GORTEX_DEBUG=true npm run dev
done
```

---

## 🆘 En cas de problème

### Le processus se bloque ?
**Action** : Appuyez sur `Ctrl+C` et vérifiez les logs.

### Erreur "Provider not available" ?
**Action** : Vérifiez qu'Ollama est lancé :
```bash
ollama serve
# Dans un autre terminal
ollama list | grep magistral
```

### Le modèle n'est pas trouvé ?
**Action** : Téléchargez-le :
```bash
ollama pull magistral:24b-small-2506-q4_K_M
```

### Timeout après 2 minutes ?
**Action** : Le modèle met du temps à charger la première fois. Relancez le test.

---

## 🚀 Prêt à tester ?

**Commande finale** :

```bash
# 1. S'assurer que le build est à jour
npm run build

# 2. Lancer le test en mode DEBUG
GORTEX_DEBUG=true npm run dev
```

**Observez attentivement les logs** pour valider que les 3 corrections fonctionnent !

---

**Bon test !** 🎉
