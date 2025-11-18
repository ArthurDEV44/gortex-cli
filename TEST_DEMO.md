# 🧪 Test Gortex CLI v2.0.0

## Quick Test Commands

### 1. Build & Run
```bash
pnpm build
node dist/index.js
```

### 2. Test Each Command

#### Commit Workflow
```bash
node dist/index.js commit
# or
node dist/index.js
```

Expected:
- ✅ Animated GORTEX logo (1.5s)
- ✅ Step indicator (1/5)
- ✅ Gradient prompts
- ✅ Vim keys working (j/k)
- ✅ Progress bar animating

#### Hooks Install
```bash
node dist/index.js hooks install
```

Expected:
- ✅ Gradient prompt
- ✅ Bordered confirmation
- ✅ Success message with box

#### Stats
```bash
node dist/index.js stats
```

Expected:
- ✅ Colorful statistics
- ✅ Tables formatted

#### Help
```bash
node dist/index.js --help
node dist/index.js help-format
```

---

## Visual Checklist

### Branding
- [ ] Logo GORTEX en BigText
- [ ] Tagline avec gradient
- [ ] Brand header avec "▸ GORTEX"

### Colors & Gradients
- [ ] Cristal gradient (cyan/blue)
- [ ] Passion gradient (pink/red)
- [ ] Summer gradient (green)
- [ ] Borders cyan arrondies
- [ ] dimColor pour texte secondaire

### Components
- [ ] Select: curseur gradient, descriptions
- [ ] MultiSelect: checkboxes ◉/◯, compteur
- [ ] Confirm: bordures green/red
- [ ] TextInput: validation inline
- [ ] LoadingSpinner: dots animés
- [ ] FileDiffPreview: icônes ✚ ● ✖

### Navigation
- [ ] ↑↓ arrows work
- [ ] j/k vim keys work
- [ ] h/l vim toggle work
- [ ] Space toggle checkboxes
- [ ] Enter submit
- [ ] a select all
- [ ] i invert selection
- [ ] y/n quick confirm

### Workflow
- [ ] Step 1: Branch selection
- [ ] Step 2: File selection with preview
- [ ] Step 3: Commit message builder
- [ ] Step 4: Commit preview
- [ ] Step 5: Push prompt
- [ ] Success message with box
- [ ] Error handling with suggestions

### Polish
- [ ] Animations smooth (60fps)
- [ ] No flickering
- [ ] Colors well contrasted
- [ ] Spacing consistent
- [ ] Help text visible
- [ ] No TypeScript errors
- [ ] Build completes <30ms

---

## Performance Tests

```bash
# Measure build time
time pnpm build

# Should be ~25ms

# Measure bundle size
ls -lh dist/index.js

# Should be ~57KB
```

---

## Screenshots to Take

1. **Intro Screen**: Logo animé
2. **Branch Selection**: Select avec gradient
3. **File Preview**: Diff avec icônes
4. **MultiSelect**: Checkboxes + compteur
5. **Progress Bar**: Step indicator
6. **Commit Preview**: Box avec bordures
7. **Success**: Message de succès
8. **Error**: Message d'erreur avec suggestions

---

## Demo Script

```bash
# 1. Clean slate
cd /tmp
git init test-gortex
cd test-gortex

# 2. Create some files
echo "# Test" > README.md
echo "console.log('test')" > index.js
git add .
git commit -m "initial"

# 3. Make changes
echo "# Updated" > README.md
echo "new file" > new.js
rm index.js

# 4. Run Gortex
node /path/to/gortex-cli/dist/index.js

# 5. Follow workflow
# - Select branch (main)
# - Select all files
# - Choose type: feat
# - Enter subject: "add awesome features"
# - Confirm
# - Push: No
```

---

## Troubleshooting

### Colors not showing
```bash
# Check terminal supports colors
echo $TERM
# Should be: xterm-256color or similar
```

### Animations laggy
```bash
# Check Node version
node --version
# Should be >=18.0.0
```

### Build fails
```bash
# Clean and rebuild
rm -rf dist node_modules
pnpm install
pnpm build
```

---

## Success Criteria

✅ All commands run without errors
✅ Colors and gradients display correctly
✅ Animations are smooth (60fps)
✅ Vim keys work everywhere
✅ Quick actions (a/i/y/n) work
✅ Help text visible and clear
✅ Build completes in <30ms
✅ Bundle size ~57KB
✅ TypeScript type check passes
✅ Professional look and feel

---

**Ready to ship!** 🚀
