# Changelog

All notable changes to Gortex CLI will be documented in this file.

## [3.0.1] - 2025-11-18

### 🐛 Bug Fixes

#### Push Authentication Blocking (CRITICAL)
- **Fixed**: Push step no longer hangs when using HTTPS remotes that require authentication
- **Root Cause**: Ink framework cannot handle interactive authentication prompts from child git processes
- **Solution**: Detect HTTPS remotes and display guidance instead of attempting interactive push
- **Impact**: Workflow now completes successfully for HTTPS remotes
- **Changes**:
  - Added `getRemoteUrl()` and `isHttpsRemote()` utility functions in `src/utils/git.ts`
  - Enhanced `PushPrompt` component to detect and handle HTTPS remotes gracefully
  - Display clear instructions for manual push: `git push origin <branch>`
  - Provide guidance for long-term solutions (SSH setup or credential helper)
- **Files Modified**:
  - `src/utils/git.ts` - Added remote URL detection functions
  - `src/components/PushPrompt.tsx` - Added HTTPS detection and guidance display
- **Documentation**: See `HTTPS_PUSH_FIX.md` for complete details

### 📖 User Experience

**Before v3.0.1:**
```
Push en cours...
Username for 'https://github.com':
[FROZEN - Application hangs indefinitely]
```

**After v3.0.1:**
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

## [3.0.0] - 2025-11-18

### 🚨 BREAKING CHANGES

This is a major UX refactor that changes the workflow interaction model.

#### What Changed
- Main workflow now uses **tabbed interface** instead of linear flow
- AI generation is **integrated** into commit workflow (step 3)
- Command `gortex ai-suggest` is **deprecated** (still works with warning)

#### Migration Guide
**Before v3.0:**
```bash
# Two separate workflows
gortex commit          # Manual workflow
gortex ai-suggest      # AI workflow
```

**After v3.0:**
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
