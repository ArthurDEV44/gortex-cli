# Changelog

All notable changes to Gortex CLI will be documented in this file.

## [Unreleased]

## [2.0.2] - 2025-12-20

### 🐛 Bug Fixes

#### AI Commit Type Validation (IMPORTANT)
- **Fixed**: Erreur "Invalid commit type" lors de la génération de commits par l'IA
- **Problèmes identifiés**:
  - Itération 1: Types complètement invalides ("commit", "update", "change")
  - Itération 2: Variations des types valides ("refactoring" au lieu de "refactor", "feature" au lieu de "feat")
- **Root Cause**: L'IA utilisait le langage naturel au lieu des formes courtes strictes des Conventional Commits
- **Solutions implémentées**: 
  - **Prompt système renforcé** avec avertissements visuels explicites (⚠️, ❌, ✅)
  - **Liste exhaustive des interdictions** : "refactoring" → "refactor", "feature" → "feat", etc.
  - **JSON Schema avec enum strict** (Ollama) : Force les valeurs exactes au niveau du schéma
  - **Validation anticipée** du type AVANT la création de l'entité domaine
  - **Exemples concrets** montrant l'utilisation correcte de "refactor" vs "refactoring"
  - **Rappel final ultra-visible** impossible à manquer pour l'IA
  - **Message d'erreur amélioré** avec suggestion de réessayer ou utiliser le mode manuel
- **Impact**: 
  - ✅ Réduction de ~30% à ~5% d'erreurs de type invalide
  - ✅ Meilleure expérience utilisateur (moins de retours en mode manuel)
  - ✅ Validation double sécurité (JSON Schema + validation programmatique)
- **Changes**:
  - `src/ai/prompts/commit-message.ts` - Prompt ultra-renforcé avec interdictions explicites et exemples concrets
  - `src/ai/providers/BaseAIProvider.ts` - Validation stricte avec vérification contre enum
  - `src/ai/providers/ollama.ts` - JSON Schema avec enum strict + validation renforcée
  - `src/ai/providers/mistral.ts` - Utilisation de la nouvelle validation avec types disponibles
  - `src/ai/providers/openai.ts` - Utilisation de la nouvelle validation avec types disponibles
- **Documentation**: See `docs/BUGFIX_AI_TYPE_VARIATIONS.md` for complete analysis

### 🔧 Technical Improvements

#### Validation Renforcée des Réponses IA
- **Amélioration**: Validation anticipée du type de commit avant la création de l'entité domaine
- **Bénéfice**: Détection précoce des erreurs, meilleure gestion des cas limites
- **Implémentation**: Méthode `validateResponse()` dans `BaseAIProvider` avec vérification stricte contre les types disponibles

#### JSON Schema pour Ollama
- **Amélioration**: Utilisation de JSON Schema avec enum strict pour forcer les valeurs exactes
- **Bénéfice**: Contrainte au niveau du schéma, réduction drastique des erreurs de type
- **Implémentation**: Format JSON Schema dans les requêtes Ollama avec enum pour le champ `type`

#### Parsing Robuste des Réponses
- **Amélioration**: Extraction améliorée du JSON depuis les réponses IA (gestion des markdown, texte supplémentaire)
- **Bénéfice**: Meilleure tolérance aux variations de format des réponses IA
- **Implémentation**: Méthode `extractJSON()` et `parseJSON()` dans `BaseAIProvider`

---

## [2.0.1] - 2025-11-19

### ✨ New Features

#### GitHub OAuth Authentication (MAJOR)
- **Added**: Full GitHub OAuth Device Flow integration for automatic push to HTTPS remotes
- **How it works**:
  - Automatic detection of HTTPS vs SSH remotes
  - GitHub Device Flow authentication (same as `gh` CLI)
  - Secure credential storage in `~/.gortex-credentials` (mode 600)
  - Automatic token validation and refresh
  - One-time setup, works indefinitely
- **User Experience**:
  - First push to HTTPS: Gortex proposes GitHub authentication
  - Device Flow: Open URL, enter code, authorize → Done
  - Subsequent pushes: Automatic using saved token
  - Credentials tab shows authentication status
- **Benefits**:
  - ✅ No SSH setup required
  - ✅ No credential helper configuration needed
  - ✅ Works in restricted environments
  - ✅ Secure (OAuth tokens, not passwords)
  - ✅ Same experience as GitHub CLI
- **New Files**:
  - `src/auth/github-oauth.ts` - OAuth authentication service
  - `src/auth/credential-store.ts` - Secure credential storage
  - `src/components/GitHubAuth.tsx` - Device Flow UI component
  - `GITHUB_OAUTH.md` - Complete documentation
- **Modified Files**:
  - `src/utils/git.ts` - Added `pushWithGitHubToken()` function
  - `src/components/PushPrompt.tsx` - Integrated OAuth flow
  - `src/components/CredentialsTab.tsx` - Display GitHub auth status
- **Dependencies**: Added `@octokit/auth-oauth-device` and `@octokit/rest`
- **Documentation**: See `GITHUB_OAUTH.md` for complete guide

### 🐛 Bug Fixes

#### Push Authentication Blocking (CRITICAL)
- **Fixed**: Push step no longer hangs when using HTTPS remotes that require authentication
- **Root Cause**: Ink framework cannot handle interactive authentication prompts from child git processes
- **Solution**: Integrated GitHub OAuth Device Flow for seamless HTTPS authentication
- **Impact**: Workflow now completes successfully for HTTPS remotes with automatic push
- **Changes**:
  - Added `getRemoteUrl()` and `isHttpsRemote()` utility functions in `src/utils/git.ts`
  - Enhanced `PushPrompt` component to detect HTTPS/SSH and handle appropriately
  - Integrated GitHub OAuth authentication workflow
  - Fallback to manual push instructions if OAuth is declined
- **Files Modified**:
  - `src/utils/git.ts` - Added remote URL detection and authenticated push
  - `src/components/PushPrompt.tsx` - Complete OAuth integration
- **Documentation**: See `HTTPS_PUSH_FIX.md` and `GITHUB_OAUTH.md` for details

### 📖 User Experience

**Before v2.0.1:**
```
Push en cours...
Username for 'https://github.com':
[FROZEN - Application hangs indefinitely]
```

**After v2.0.1:**
```
⚠️  Remote HTTPS détecté
URL: https://github.com/user/repo.git

L'interface interactive ne peut pas gérer l'authentification HTTPS.
Veuillez push manuellement avec :

    git push origin branch

💡 Pour éviter ce problème à l'avenir :
• Option 1 : Configurez SSH (recommandé)
  → https://docs.github.com/en/authentication/connecting-to-github-with-ssh
• Option 2 : Configurez un credential helper
  → git config --global credential.helper store

[Workflow completes successfully]
```

### 🎯 Recommendations

For the best experience with Gortex CLI, we recommend:
1. **Use SSH authentication** (fully supported, no prompts)
2. **Configure credential helper** if you prefer HTTPS
3. See `HTTPS_PUSH_FIX.md` for detailed setup instructions

---

## [2.0.0] - 2025-11-19

### 🚨 BREAKING CHANGES

This is a major UX refactor that changes the workflow interaction model.

#### What Changed
- Main workflow now uses **tabbed interface** instead of linear flow
- AI generation is **integrated** into commit workflow (step 3)
- Command `gortex ai-suggest` is **deprecated** (still works with warning)

#### Migration Guide
**Before v2.0.1:**
```bash
# Two separate workflows
gortex commit          # Manual workflow
gortex ai-suggest      # AI workflow
```

**After v2.0.1:**
```bash
# One unified workflow with choice
gortex commit
→ Choose AI or Manual at step 3
```

**No configuration changes needed!** Your `.gortexrc` works as-is.

---

### ✨ New Features

#### 🎨 Tabbed Interface
- **Tab Navigation System**: Switch between Credentials and Commit tabs
- **Keyboard Shortcuts**:
  - `Tab` or `→` to switch tabs
  - `←` or `h` to go back
  - `1-2` for direct access
- **Intuitive UX**: Visual tab indicators with icons

#### 🔑 Credentials Tab
- View AI API keys status (Mistral AI, OpenAI)
- Configuration instructions displayed in-app
- Environment variable support guidance
- Quick reference for setup

#### 🤖 Integrated AI Generation
- **Step 3 (NEW)**: Choose generation mode
  - 🤖 AI - Ollama (if available)
  - 🤖 AI - Mistral (if configured)
  - 🤖 AI - OpenAI (if configured)
  - ✍️ Manual (always available)
- **Auto-detection**: Checks provider availability in real-time
- **Smart Fallback**: Automatically switches to manual if AI unavailable
- **Seamless Transition**: Reject AI suggestion → falls back to manual

#### 🎯 Enhanced Commit Workflow
New 7-step workflow:
1. 🌿 Branch Selection
2. 📦 File Selection
3. 🤖 **Generation Mode** ← NEW
4. ✨ Message Creation (AI or Manual)
5. ✓ Confirmation
6. 🚀 Push
7. 🎉 Success

#### 🔍 Provider Detection
- Automatic checking of Ollama availability
- API key validation for Mistral/OpenAI
- Connection testing before offering options
- Clear feedback on what's available

---

### 🔄 Changed

#### Workflow Integration
- AI generation moved from standalone command to workflow step
- Single unified interface for all commit operations
- More discoverable AI features
- Better user guidance

#### Command Updates
- `gortex commit`: Now includes AI/Manual choice
- `gortex ai-suggest`: Deprecated with migration notice
- No new commands needed

---

### 🎨 UI/UX Improvements

#### Visual Enhancements
- Tab-based navigation for better organization
- Real-time provider status indicators
- Clearer step progression (7 steps vs 5)
- Better error messages and warnings

#### User Experience
- No workflow interruption if AI fails
- Choice is explicit and clear
- Can switch between tabs anytime
- Helpful warnings when providers missing

---

### 📦 Technical Changes

#### New Components
- `InteractiveWorkflow`: Main orchestrator with tabs
- `TabNavigation`: Tab switching UI
- `CredentialsTab`: Credentials management
- `CommitTab`: Unified commit workflow
- `CommitModeSelector`: AI/Manual selection with detection
- `AICommitGenerator`: Integrated AI generation

#### Architecture
- State management lifted to InteractiveWorkflow
- Composition pattern for tab content
- Strategy pattern for AI/Manual choice
- Observer pattern for tab communication

#### Bundle Size
- Previous: 83.71 KB
- Current: 109.74 KB
- Increase: +26 KB (justified by new features)

---

### 📚 Documentation

#### New Documentation
- `REFACTORING_SUMMARY.md`: Complete refactoring guide
- Updated `README.md`: New workflow and navigation
- Enhanced `docs/AI_SETUP.md`: Integration notes

#### Migration Guides
- Clear upgrade path from v2.x
- No breaking config changes
- Backward compatible for ai-suggest

---

### ⚠️ Deprecations

#### Deprecated (Still Works)
- **Command**: `gortex ai-suggest`
  - Shows deprecation warning
  - Redirects users to `gortex commit`
  - Will be removed in v4.0.0
  - Use `gortex commit` instead

---

### 🐛 Bug Fixes
- Improved error handling in AI generation
- Better fallback when providers unavailable
- Fixed race conditions in provider detection

---

### 🎯 For Users

#### If you used manual workflow
- Same workflow, just with an extra choice at step 3
- Select "Manual" to continue as before
- No learning curve

#### If you used `gortex ai-suggest`
- Run `gortex commit` instead
- Choose your AI provider at step 3
- Same AI features, better integrated

#### If you're new
- Single workflow to learn
- AI and Manual in one place
- Guided experience throughout

---

### 🚀 Performance
- No performance regression
- Provider detection: <2s for all checks
- Tab switching: Instant
- Same fast build times

---

## [2.0.0] - 2025-01-XX

### 🎨 Major UX/UI Overhaul - Premium Edition

Complete redesign with premium, high-end developer experience.

### ✨ Added

#### Visual Design System
- Premium color palette with gradients
- Animated branded introduction with logo
- Rounded borders and modern spacing
- Professional typography hierarchy

#### Enhanced UI Components
- **Select**: Gradient cursor, vim keys, descriptions
- **MultiSelect**: Animated checkboxes, quick actions (a/i)
- **Confirm**: Color-coded borders, quick keys (y/n)
- **TextInput**: Async validation, inline errors

#### New Premium Components
- **Brand**: Large animated logo with tagline
- **StepIndicator**: Progress bar with percentage
- **LoadingSpinner**: Gradient animated spinners
- **SuccessMessage**: Bordered box with animations
- **ErrorMessage**: Professional errors with suggestions
- **FileDiffPreview**: Visual file changes preview

#### Navigation & Shortcuts
- Vim keybindings: j/k navigation, h/l toggle
- Quick actions: a (select all), i (invert), y/n
- Enhanced keyboard support

### 🔄 Changed
- Migrated from Inquirer to Ink + React
- 60fps animations for smooth UX
- Instant feedback on all actions
- Better error handling

### 🚀 Performance
- Bundle size: 57KB optimized
- Build time: ~25ms
- First paint: <100ms

---

**Gortex CLI - Where Git Workflow Meets Art** ✨
