# 🤖 Configuration AI pour Gortex CLI

Gortex CLI peut utiliser l'intelligence artificielle pour générer automatiquement des messages de commit conventionnels basés sur vos changements.

## 📋 Providers supportés

| Provider | Type | Avantages | Prérequis |
|----------|------|-----------|-----------|
| **Ollama** | Local | Gratuit, privé, aucune API key | Ollama installé localement |
| **Mistral AI** | Cloud | Rapide, performant | API key Mistral |
| **OpenAI** | Cloud | Très performant | API key OpenAI |

---

## 🚀 Configuration rapide

### Option 1: Ollama (Recommandé - Local & Gratuit)

**Étape 1**: Installer Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Téléchargez depuis https://ollama.com/download
```

**Étape 2**: Télécharger le modèle
```bash
ollama pull mistral:7b
```

**Étape 3**: Configurer Gortex
Créez un fichier `.gortexrc` à la racine de votre projet :

```json
{
  "ai": {
    "enabled": true,
    "provider": "ollama",
    "ollama": {
      "model": "mistral:7b"
    }
  }
}
```

**Étape 4**: Tester
```bash
# Stagez des fichiers
git add .

# Générez un commit avec l'AI
gortex ai-suggest
```

---

### Option 2: Mistral AI (API Cloud)

**Étape 1**: Obtenir une API key
1. Allez sur https://console.mistral.ai/
2. Créez un compte
3. Générez une API key dans la section "API Keys"

**Étape 2**: Configurer Gortex

**Méthode A**: Via variable d'environnement (recommandé)
```bash
export MISTRAL_API_KEY="votre_cle_api"
```

**Méthode B**: Via `.gortexrc`
```json
{
  "ai": {
    "enabled": true,
    "provider": "mistral",
    "mistral": {
      "apiKey": "votre_cle_api",
      "model": "mistral-small-latest"
    }
  }
}
```

**Étape 3**: Tester
```bash
git add .
gortex ai-suggest
```

---

### Option 3: OpenAI (API Cloud)

**Étape 1**: Obtenir une API key
1. Allez sur https://platform.openai.com/
2. Créez un compte
3. Générez une API key dans la section "API Keys"

**Étape 2**: Configurer Gortex

**Méthode A**: Via variable d'environnement (recommandé)
```bash
export OPENAI_API_KEY="votre_cle_api"
```

**Méthode B**: Via `.gortexrc`
```json
{
  "ai": {
    "enabled": true,
    "provider": "openai",
    "openai": {
      "apiKey": "votre_cle_api",
      "model": "gpt-4o-mini"
    }
  }
}
```

**Étape 3**: Tester
```bash
git add .
gortex ai-suggest
```

---

## ⚙️ Configuration avancée

### Modèles Ollama recommandés

| Modèle | Taille | RAM requise | Performance | Usage recommandé |
|--------|--------|-------------|-------------|------------------|
| `mistral:7b` | 4.1 GB | 8 GB | ⭐⭐⭐⭐ | **Recommandé** - Équilibre qualité/vitesse |
| `phi:2.7b` | 1.6 GB | 4 GB | ⭐⭐⭐ | Machines limitées (laptops) |
| `mistral-nemo:12b` | 7 GB | 16 GB | ⭐⭐⭐⭐⭐ | Machines puissantes |
| `codestral:22b` | 13 GB | 24 GB | ⭐⭐⭐⭐⭐ | Workstations (focus code) |

### Modèles Mistral AI

| Modèle | Prix | Performance | Usage recommandé |
|--------|------|-------------|------------------|
| `mistral-small-latest` | $ | ⭐⭐⭐⭐ | **Recommandé** - Bon rapport qualité/prix |
| `mistral-large-latest` | $$$ | ⭐⭐⭐⭐⭐ | Projets critiques |
| `codestral-latest` | $$ | ⭐⭐⭐⭐⭐ | Spécialisé pour le code |

### Modèles OpenAI

| Modèle | Prix | Performance | Usage recommandé |
|--------|------|-------------|------------------|
| `gpt-4o-mini` | $ | ⭐⭐⭐⭐ | **Recommandé** - Économique et performant |
| `gpt-4o` | $$$ | ⭐⭐⭐⭐⭐ | Maximum de qualité |
| `gpt-4-turbo` | $$ | ⭐⭐⭐⭐⭐ | Bon compromis |

---

## 🎛️ Options de configuration

### Configuration complète `.gortexrc`

```json
{
  "ai": {
    "enabled": true,
    "provider": "ollama",

    "ollama": {
      "model": "mistral:7b",
      "baseUrl": "http://localhost:11434",
      "timeout": 30000
    },

    "mistral": {
      "apiKey": "${MISTRAL_API_KEY}",
      "model": "mistral-small-latest",
      "baseUrl": "https://api.mistral.ai"
    },

    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "model": "gpt-4o-mini",
      "baseUrl": "https://api.openai.com"
    },

    "temperature": 0.3,
    "maxTokens": 500,
    "autoSuggest": false,
    "requireConfirmation": true
  }
}
```

### Paramètres expliqués

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `enabled` | boolean | `false` | Active/désactive l'AI |
| `provider` | string | `"ollama"` | Provider à utiliser: `ollama`, `mistral`, `openai` |
| `temperature` | number | `0.3` | Créativité (0.0-1.0). Plus bas = plus déterministe |
| `maxTokens` | number | `500` | Longueur max de la réponse |
| `autoSuggest` | boolean | `false` | Suggère automatiquement dans le workflow |
| `requireConfirmation` | boolean | `true` | Demande confirmation avant commit |

---

## 💡 Utilisation

### Commande standalone
```bash
# Stagez des fichiers
git add src/api/auth.ts src/utils/jwt.ts

# Générez une suggestion
gortex ai-suggest
```

### Output exemple
```
✨ Suggestion générée par Ollama

Message de commit proposé:
  feat(api): add JWT authentication middleware

  Implement JWT-based authentication middleware to secure
  API endpoints. Adds token validation and user context
  extraction for protected routes.

Raisonnement:
  The changes introduce new authentication functionality (feat),
  focused on the API layer (api scope). The middleware pattern
  and JWT utilities indicate a security feature addition.

Confiance: 87% 🎯

❯ Utiliser cette suggestion pour créer le commit ? (Y/n)
```

---

## 🔧 Troubleshooting

### Ollama: "Provider non disponible"

**Problème**: Ollama n'est pas accessible

**Solutions**:
```bash
# Vérifiez qu'Ollama tourne
ollama list

# Démarrez le service
ollama serve

# Vérifiez que le modèle est installé
ollama pull mistral:7b

# Testez manuellement
ollama run mistral:7b "hello"
```

### Mistral/OpenAI: "API key manquante"

**Problème**: API key non configurée

**Solutions**:
```bash
# Méthode 1: Variable d'environnement (recommandé)
export MISTRAL_API_KEY="votre_cle"
export OPENAI_API_KEY="votre_cle"

# Méthode 2: .env dans votre projet
echo "MISTRAL_API_KEY=votre_cle" >> .env

# Méthode 3: .gortexrc (moins sécurisé)
# Ajoutez la clé directement dans la config
```

### "Diff trop long"

**Problème**: Trop de changements stagés

**Solutions**:
```bash
# Committez par petits morceaux
git reset
git add src/specific-file.ts
gortex ai-suggest

# Ou augmentez la limite (dans le code analyzer.ts)
```

---

## 🎯 Bonnes pratiques

### 1. Stagez intelligemment
```bash
# ❌ Évitez de tout stager d'un coup
git add .

# ✅ Stagez par fonctionnalité logique
git add src/api/auth.ts src/middleware/jwt.ts
gortex ai-suggest
```

### 2. Vérifiez toujours la suggestion
L'AI est un **assistant**, pas un remplaçant. Toujours relire et ajuster si nécessaire.

### 3. Contexte clair
Plus vos changements sont cohérents et ciblés, meilleure sera la suggestion.

### 4. Scopes configurés
Définissez des scopes dans `.gortexrc` pour guider l'AI :
```json
{
  "scopes": ["api", "ui", "auth", "database", "config"]
}
```

---

## 🔒 Sécurité & Vie privée

### Ollama (Local)
- ✅ **100% privé** - Aucune donnée n'est envoyée en ligne
- ✅ Code source reste sur votre machine
- ✅ Aucun tracking

### Mistral AI / OpenAI (Cloud)
- ⚠️ Votre **diff est envoyé** au provider
- ⚠️ Ne commitez **jamais** de secrets, tokens, ou données sensibles
- ✅ Utilisez `.gitignore` pour exclure les fichiers sensibles
- ✅ Les providers ne stockent pas vos données (selon leurs politiques)

---

## 📊 Comparaison des providers

| Critère | Ollama | Mistral AI | OpenAI |
|---------|--------|------------|--------|
| **Prix** | Gratuit | ~0.001$/req | ~0.0001$/req |
| **Vitesse** | Moyenne (CPU-dependent) | Rapide | Rapide |
| **Qualité** | Bonne | Excellente | Excellente |
| **Vie privée** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Setup** | Complexe | Simple | Simple |
| **Offline** | ✅ Oui | ❌ Non | ❌ Non |

---

## 🚀 Prochaines étapes

1. **Configurez votre provider préféré**
2. **Testez sur de vrais commits**
3. **Ajustez `temperature` et `maxTokens` selon vos préférences**
4. **Partagez votre config `.gortexrc` avec votre équipe**

---

## 📚 Ressources

- [Ollama Documentation](https://ollama.com/docs)
- [Mistral AI API Docs](https://docs.mistral.ai/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Besoin d'aide ?** Ouvrez une issue sur [GitHub](https://github.com/ArthurDEV44/gortex-cli/issues)
