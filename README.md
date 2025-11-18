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

### Interactive Commit (Default)

Simply run in your Git repository:

```bash
gortex
```

Or explicitly:

```bash
gortex commit
```

This launches the **premium 5-step workflow**:

1. 🌿 **Branch Selection** - Choose or create a branch
2. 📦 **File Selection** - Preview and select files to stage
3. 💬 **Commit Message** - Build a conventional commit message
4. ✓ **Confirmation** - Review and confirm your commit
5. 🚀 **Push** - Optionally push to remote

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
