<div align="center">

# 🚀 GORTEX CLI

### **Where Git Workflow Meets Art** ✨

[![npm version](https://badge.fury.io/js/gortex-cli.svg)](https://www.npmjs.com/package/gortex-cli)
[![npm downloads](https://img.shields.io/npm/dm/gortex-cli.svg)](https://www.npmjs.com/package/gortex-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Premium interactive CLI for crafting perfect conventional commits**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Premium UX](#-premium-ux) • [Configuration](#-configuration)

</div>

---

## 🌟 What Makes Gortex Special?

**Gortex CLI** isn't just another Git tool. It's a **premium, high-end developer experience** that transforms the mundane task of committing code into a delightful, guided workflow.

### ✨ Premium Features

🎨 **Stunning Visual Design**
- Gradient-powered interface with smooth animations
- Professional branding with animated logo
- Color-coded feedback and intelligent spacing

⚡ **Lightning Fast**
- 60fps smooth animations
- <100ms first paint
- Optimized 57KB bundle

🎯 **Intelligent UX**
- Vim keybindings support (j/k/h/l)
- Quick actions (a=select all, i=invert)
- Contextual descriptions everywhere
- Real-time validation with helpful errors

📦 **Complete Git Workflow**
- Branch selection/creation
- Visual file diff preview
- Commit message builder
- Push to remote (optional)

🤖 **AI-Powered Commits (Integrated)**
- Choose AI or Manual generation directly in the workflow
- Support for Ollama (local), Mistral AI, and OpenAI
- Auto-detection of available providers
- Smart fallback to manual if AI unavailable
- Context-aware suggestions with confidence scoring
- 100% private with local Ollama

---

## 🚀 Installation

Choose your favorite package manager:

### NPM
```bash
npm install -g gortex-cli
```

### PNPM (Recommended)
```bash
pnpm add -g gortex-cli
```

### Yarn
```bash
yarn global add gortex-cli
```

### Bun
```bash
bun add -g gortex-cli
```

### Try without installing
```bash
npx gortex-cli
```

---

## 💫 Usage

### Interactive Workflow with Tabs (Default)

Simply run in your Git repository:

```bash
gortex
```

Or explicitly:

```bash
gortex commit
```

This launches the **premium interactive workflow with tabs**:

**🔑 Credentials Tab:**
- View AI API keys status (Mistral, OpenAI)
- Instructions for configuration
- Environment variable support

**📝 Commit Tab (8-step workflow):**
1. 🌿 **Branch Selection** - Choose or create a branch
2. 📦 **File Selection** - Preview and select files to stage
3. 📥 **Staging** - Files are staged automatically
4. 🤖 **Generation Mode** - Choose AI (Ollama/Mistral/OpenAI) or Manual
5. ✨ **Message Creation** - AI-generated or manual based on your choice
6. ✓ **Confirmation** - Review and confirm your commit
7. 🚀 **Push** - Optionally push to remote
8. 🎉 **Success** - Completion summary

**Navigation:**
- `Tab` or `→` to switch between tabs
- `1-2` for direct tab access
- `h/l` for vim-style navigation

### Git Hooks

Install validation hooks to enforce conventional commits:

```bash
gortex hooks install
```

Remove hooks:

```bash
gortex hooks uninstall
```

### Statistics

View commit statistics:

```bash
gortex stats
# or analyze last 200 commits
gortex stats -n 200
```

### 🤖 AI-Powered Commit Messages (Integrated!)

AI generation is now **integrated directly into the main workflow**!

When you run `gortex commit`, you'll be able to choose at step 3:
- 🤖 **AI Generation** (Ollama/Mistral/OpenAI) - if available
- ✍️ **Manual** - classic guided workflow

**Supported AI Providers:**
- **Ollama** (local, free, private) - Recommended for most users
- **Mistral AI** (cloud, API key required)
- **OpenAI** (cloud, API key required)

**Smart Fallback:**
- If no AI provider is available → Manual mode automatically
- If you reject AI suggestion → Falls back to manual
- Always a smooth experience!

**Quick Start with Ollama:**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the model
ollama pull mistral:7b

# Configure Gortex (optional, works out of the box)
echo '{
  "ai": {
    "enabled": true,
    "provider": "ollama"
  }
}' > .gortexrc

# Use it!
gortex commit
# → Select files at step 2
# → Choose "AI - Ollama" at step 4
```

**Note:** The standalone `gortex ai-suggest` command is deprecated but still works.

---

### 🤖 Using Ollama with Gortex CLI

Ollama is the **recommended AI provider** for Gortex CLI - it's free, fast, and 100% private.

#### Installation

**macOS & Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from [ollama.com/download](https://ollama.com/download)

#### Essential Commands for Gortex

**1. Download a model (required before first use):**
```bash
# Recommended for Gortex (4GB RAM)
ollama pull mistral:7b

# Alternative - lighter model (1.6GB RAM)
ollama pull phi:2.7b

# Alternative - larger model (7GB RAM, better quality)
ollama pull mistral-nemo:12b
```

**2. Start Ollama service:**
```bash
ollama serve
```
> **Note:** Ollama must be running for Gortex to use it. The service runs on `http://localhost:11434`

**3. Verify your models:**
```bash
ollama ls
```
Output:
```
NAME              ID              SIZE    MODIFIED
mistral:7b        abc123def456    4.1 GB  2 hours ago
phi:2.7b          def789ghi012    1.6 GB  1 day ago
```

**4. Test a model:**
```bash
ollama run mistral:7b "Generate a git commit message for adding user authentication"
```

**5. Check running models:**
```bash
ollama ps
```

**6. Stop a model (free memory):**
```bash
ollama stop mistral:7b
```

**7. Remove a model:**
```bash
ollama rm mistral:7b
```

#### Recommended Models for Gortex

| Model | Size | RAM Required | Quality | Use Case |
|-------|------|--------------|---------|----------|
| **mistral:7b** | 4.1 GB | 8 GB | ⭐⭐⭐⭐ | **Recommended** - Best balance |
| phi:2.7b | 1.6 GB | 4 GB | ⭐⭐⭐ | Laptops with limited RAM |
| mistral-nemo:12b | 7 GB | 16 GB | ⭐⭐⭐⭐⭐ | Powerful workstations |
| codestral:22b | 13 GB | 24 GB | ⭐⭐⭐⭐⭐ | Code-focused (larger commits) |

#### Configuration in Gortex

Create a `.gortexrc` file in your project root:

```json
{
  "ai": {
    "enabled": true,
    "provider": "ollama",
    "ollama": {
      "model": "mistral:7b",
      "baseUrl": "http://localhost:11434",
      "timeout": 30000
    }
  }
}
```

**Advanced configuration:**

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
    "temperature": 0.3,
    "maxTokens": 500
  }
}
```

#### Troubleshooting Ollama

**Problem: "Ollama not available"**
```bash
# Check if Ollama is running
ollama ps

# If not running, start it
ollama serve
```

**Problem: "Model not found"**
```bash
# List installed models
ollama ls

# Pull the model if missing
ollama pull mistral:7b
```

**Problem: "Connection refused"**
```bash
# Check Ollama is running on default port
curl http://localhost:11434/api/tags

# If different port, update .gortexrc baseUrl
```

**Problem: "Slow generation"**
- Use a smaller model: `phi:2.7b`
- Increase timeout in config: `"timeout": 60000`
- Check CPU usage: Ollama uses CPU if no GPU

#### Tips for Best Results

1. **Keep Ollama running**: Start `ollama serve` in background
2. **Use appropriate model**: Match model size to your machine
3. **Clear commits**: Smaller, focused changes = better AI suggestions
4. **First run is slower**: Model loads on first use (cached after)

#### Why Ollama for Gortex?

✅ **100% Private** - Your code never leaves your machine
✅ **Free** - No API costs
✅ **Fast** - Local generation (1-3s on average CPU)
✅ **Offline** - Works without internet
✅ **No limits** - Unlimited commits
✅ **No API keys** - Zero configuration hassle

### Help

```bash
gortex --help
gortex help-format  # Conventional commits format guide
```

---

## 🎨 Premium UX

### Animated Introduction

Every session starts with a stunning branded introduction:

```
 ██████╗  ██████╗ ██████╗ ████████╗███████╗██╗  ██╗
██╔════╝ ██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝
██║  ███╗██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝
██║   ██║██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗
╚██████╔╝╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗
 ╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝

⚡ Git Workflow, Elevated ⚡
```

### Progress Visualization

Beautiful step indicators show your progress:

```
▸ GORTEX | Git Workflow CLI

🌿 Branch Selection [1/5]
┌────────────────────────────────┐
│ ████████████████░░░░░░░░░░░░░░ │ 53%
└────────────────────────────────┘
```

### File Diff Preview

Visual preview of changes before staging:

```
┌─────────────────────────────────┐
│ 📝 Changed Files (12 total)     │
├─────────────────────────────────┤
│ ✚ nouveau    src/ui/Select.tsx  │
│ ● modifié    package.json       │
│ ✖ supprimé   old-file.js        │
│ ● modifié    README.md          │
│ ✚ nouveau    src/theme/colors.ts│
│                                  │
│ ... and 7 more files            │
└─────────────────────────────────┘
```

### Smart Selection

Multi-select with live feedback and quick actions:

```
? Select files to stage:

Selected: 3 / 12

┌──────────────────────────────────┐
│ ❯ ◉ [nouveau] src/ui/Select.tsx │
│     Choose specific files        │
│   ◯ [modifié] package.json      │
│   ◉ [modifié] README.md         │
│   ◉ [nouveau] CHANGELOG.md      │
└──────────────────────────────────┘

↑↓ navigate • space toggle • enter submit
a select all • i invert • j/k vim keys
```

### Commit Preview

Professional preview before committing:

```
┌─────────────────────────────────┐
│ 📋 Commit Preview                │
│                                   │
│ Files (3):                       │
│   ✓ src/ui/Select.tsx           │
│   ✓ package.json                │
│   ✓ README.md                   │
│                                   │
│ Message:                         │
│   feat(ui): add premium select   │
│                                   │
│   Add gradient cursor and vim    │
│   keybindings support            │
└─────────────────────────────────┘

? Create this commit?
┌──────────────────┐
│ ✓ Yes / No      │
└──────────────────┘
```

### Success Celebration

Elegant success message with details:

```
┌─────────────────────────────────┐
│ ✓ Workflow Complete!            │
│                                   │
│ Your commit has been created     │
│ successfully                     │
│                                   │
│ ▸ Branch: feature/premium-ui    │
│ ▸ Files: 3 changed              │
│ ▸ Message: feat(ui): add...    │
└─────────────────────────────────┘
```

---

## ⚙️ Configuration

Gortex CLI supports multiple configuration formats:

### Option 1: `.gortexrc` (JSON)

```json
{
  "types": [
    {
      "value": "feat",
      "name": "feat:     ✨ New feature",
      "description": "A new feature"
    },
    {
      "value": "fix",
      "name": "fix:      🐛 Bug fix",
      "description": "A bug fix"
    }
  ],
  "scopes": ["ui", "api", "core", "docs"],
  "allowCustomScopes": true,
  "maxSubjectLength": 100,
  "minSubjectLength": 3
}
```

### Option 2: `gortex.config.js` (JavaScript)

```javascript
export default {
  types: [
    { value: 'feat', name: 'feat:     ✨ New feature' },
    { value: 'fix', name: 'fix:      🐛 Bug fix' },
  ],
  scopes: ['ui', 'api', 'core'],
  allowCustomScopes: true,
  maxSubjectLength: 100,
  minSubjectLength: 3,
};
```

### Option 3: `package.json`

```json
{
  "gortex": {
    "types": [...],
    "scopes": ["ui", "api"],
    "allowCustomScopes": true
  }
}
```

---

## 🎯 Conventional Commits Format

Gortex CLI enforces the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Commit Types

| Type | Icon | Description |
|------|------|-------------|
| **feat** | ✨ | New feature |
| **fix** | 🐛 | Bug fix |
| **docs** | 📝 | Documentation |
| **style** | 💄 | Formatting, missing semicolons |
| **refactor** | ♻️ | Code refactoring |
| **perf** | ⚡ | Performance improvement |
| **test** | ✅ | Adding/updating tests |
| **build** | 📦 | Build system changes |
| **ci** | 👷 | CI configuration changes |
| **chore** | 🔧 | Other changes |

### Examples

```bash
feat(auth): add OAuth2 authentication
fix(api): resolve timeout on large requests
docs(readme): update installation instructions
refactor(core): simplify error handling
```

### Breaking Changes

Add `!` after type/scope:

```bash
feat(api)!: change authentication method

BREAKING CHANGE: Previous auth tokens are now invalid
```

---

## 🎨 Why Premium Design Matters

### Developer Experience = Product Quality

Just like your application's UI/UX matters to your users, your **developer tools' UX matters to you**.

Gortex CLI proves that **CLI tools can be beautiful AND functional**:

✨ **Reduces Cognitive Load**
- Clear visual hierarchy
- Instant feedback
- Intuitive navigation

⚡ **Increases Productivity**
- Vim shortcuts for speed
- Quick actions (a, i, y/n)
- Smart validation prevents errors

🎯 **Improves Code Quality**
- Guided workflow ensures consistency
- Visual previews prevent mistakes
- Helpful suggestions teach best practices

---

## 🏆 Recognition

Gortex CLI is built to the same standards as industry-leading CLIs:

- **Vercel CLI** - Premium developer experience
- **Stripe CLI** - Beautiful terminal UI
- **GitHub CLI** - Professional polish

---

## 🛠️ Technical Stack

Built with modern, battle-tested technologies:

- **[Ink](https://github.com/vadimdemedes/ink)** - React for CLI interfaces
- **[React](https://react.dev/)** - Component-based architecture
- **TypeScript** - Type safety throughout
- **[simple-git](https://github.com/steveukx/git-js)** - Git operations
- **[Commander](https://github.com/tj/commander.js)** - CLI framework
- **[Cosmiconfig](https://github.com/davidtheclark/cosmiconfig)** - Configuration management

### Premium UI Libraries

- **ink-gradient** - Gradient animations
- **ink-big-text** - ASCII art branding
- **gradient-string** - Colored text
- **chalk** - Terminal styling

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| **Bundle Size** | 57KB (optimized) |
| **Build Time** | ~25ms |
| **First Paint** | <100ms |
| **Animations** | 60fps smooth |
| **Node Version** | ≥18.0.0 |

---

## 🤝 Contributing

Contributions are welcome! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/ArthurDEV44/gortex-cli.git
cd gortex-cli

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Type check
pnpm typecheck
```

---

## 📝 License

MIT © [Arthur Jean](https://github.com/ArthurDEV44)

---

## 🙏 Acknowledgments

Inspired by the amazing work of:
- **Vercel** for setting the standard in CLI UX
- **vadimdemedes** for creating Ink
- **The Conventional Commits team** for the specification

---

<div align="center">

**[⬆ back to top](#-gortex-cli)**

Made with ❤️ by developers, for developers

**Gortex CLI - Where Git Workflow Meets Art** ✨

</div>
