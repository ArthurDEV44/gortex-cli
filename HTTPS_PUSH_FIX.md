# 🔧 Fix: HTTPS Push Authentication Blocking

## Problem

When using Gortex CLI with a GitHub repository configured with HTTPS remote URL, the push step would hang indefinitely when GitHub requested authentication credentials:

```
Push en cours...
Username for 'https://github.com':
```

The interface would freeze, requiring the user to force-quit the application.

## Root Cause

**Ink Framework Limitation**: Ink (React for terminal interfaces) renders UI in a controlled terminal environment. When `git push` spawns an interactive authentication prompt, it expects to read from stdin, but Ink's rendering context blocks this interaction. The git process waits indefinitely for input that can never be provided through the Ink UI.

This is a fundamental architectural constraint:
- Git push via HTTPS requires interactive credentials (username/password or token)
- Interactive child process prompts cannot be handled by Ink's React components
- The stdin is managed by Ink for keyboard shortcuts, not for child processes

## Solution

Instead of attempting the push and hanging, we now:

1. **Detect HTTPS remotes** before attempting push
2. **Skip the interactive push** for HTTPS remotes
3. **Display clear guidance** with:
   - The exact command to run manually: `git push origin <branch>`
   - Instructions for setting up SSH (recommended)
   - Instructions for configuring credential helper (alternative)

## Implementation

### Modified Files

#### `src/utils/git.ts`

Added two new utility functions:

```typescript
/**
 * Récupère l'URL du remote
 */
export async function getRemoteUrl(remote: string = 'origin'): Promise<string | null> {
  try {
    const remotes = await git.getRemotes(true);
    const remoteObj = remotes.find(r => r.name === remote);
    return remoteObj?.refs.push || null;
  } catch {
    return null;
  }
}

/**
 * Vérifie si l'URL du remote est en HTTPS
 */
export async function isHttpsRemote(remote: string = 'origin'): Promise<boolean> {
  const url = await getRemoteUrl(remote);
  return url ? url.startsWith('https://') : false;
}
```

#### `src/components/PushPrompt.tsx`

Enhanced the component to:
1. Check if the remote is HTTPS during initialization
2. Display a helpful message instead of attempting push for HTTPS remotes
3. Provide clear guidance on how to push manually
4. Suggest long-term solutions (SSH or credential helper)

**Key Changes:**

```typescript
// Added state for HTTPS detection
const [isHttps, setIsHttps] = useState(false);
const [remoteUrl, setRemoteUrl] = useState<string>('');

// Check remote type on mount
useEffect(() => {
  const checkRemote = async () => {
    const exists = await hasRemote();
    setRemoteExists(exists);

    if (exists) {
      const remote = await getDefaultRemote();
      const httpsCheck = await isHttpsRemote(remote);
      const url = await getRemoteUrl(remote);
      setIsHttps(httpsCheck);
      setRemoteUrl(url || '');
    }

    setLoading(false);
  };
  checkRemote();
}, []);

// Show guidance for HTTPS remotes instead of attempting push
if (isHttps) {
  return (
    <Box flexDirection="column">
      <Text color="yellow">⚠️  Remote HTTPS détecté</Text>
      <Text>Veuillez push manuellement avec :</Text>
      <Text bold color="cyan">git push origin {branch}</Text>
      <Text bold>💡 Pour éviter ce problème à l'avenir :</Text>
      <Text dimColor>• Option 1 : Configurez SSH (recommandé)</Text>
      <Text dimColor>• Option 2 : Configurez un credential helper</Text>
    </Box>
  );
}
```

## User Experience

### Before the Fix

```
🚀 Push to Remote [7/8]
Push en cours...
Username for 'https://github.com':
[FROZEN - No way to input, must force-quit]
```

### After the Fix

```
🚀 Push to Remote [7/8]

⚠️  Remote HTTPS détecté
URL: https://github.com/ArthurDEV44/CommitFormat.git

L'interface interactive ne peut pas gérer l'authentification HTTPS.
Veuillez push manuellement avec :

    git push origin dev

💡 Pour éviter ce problème à l'avenir :
• Option 1 : Configurez SSH (recommandé)
  → https://docs.github.com/en/authentication/connecting-to-github-with-ssh
• Option 2 : Configurez un credential helper
  → git config --global credential.helper store

[Workflow completes successfully]
```

## Long-Term Solutions for Users

### Option 1: Configure SSH (Recommended)

SSH authentication doesn't require interactive prompts and works seamlessly with Gortex CLI.

**Steps:**

1. Generate SSH key (if not already done):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Add key to ssh-agent:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

3. Add public key to GitHub:
   - Copy: `cat ~/.ssh/id_ed25519.pub`
   - Go to GitHub Settings → SSH and GPG keys → New SSH key
   - Paste and save

4. Change remote URL to SSH:
   ```bash
   git remote set-url origin git@github.com:username/repo.git
   ```

### Option 2: Configure Credential Helper

Caches credentials so git doesn't prompt interactively.

**Steps:**

```bash
# Store credentials permanently (use with caution)
git config --global credential.helper store

# Or cache for 1 hour
git config --global credential.helper cache
git config --global credential.helper 'cache --timeout=3600'
```

After configuration, run `git push` once manually to cache credentials.

## Technical Notes

### Why Not Use Git Credential Helper in Gortex?

We considered programmatically using git credential helper, but:
- It would require storing/managing user credentials
- Security implications of credential storage
- Different platforms have different helpers
- User should maintain control over authentication

### Why Not Exit Ink Before Pushing?

We considered exiting the Ink UI and pushing in regular terminal, but:
- Breaks the unified workflow experience
- Can't show progress/success in the UI
- Complicates error handling
- User would have to re-enter Gortex to continue

### SSH Detection

The current implementation only detects HTTPS remotes. SSH remotes (starting with `git@`) will attempt push normally, which works because:
- SSH uses key-based authentication (no interactive prompt)
- If SSH keys are not set up, git fails quickly with clear error
- No hanging or blocking behavior

## Testing

### Test Case 1: HTTPS Remote (Fixed Scenario)

```bash
git remote -v
# origin  https://github.com/user/repo.git (fetch)
# origin  https://github.com/user/repo.git (push)

gortex commit
# → Workflow completes
# → Push step shows HTTPS warning and instructions
# → User can push manually: git push origin <branch>
```

### Test Case 2: SSH Remote (Should Work Normally)

```bash
git remote -v
# origin  git@github.com:user/repo.git (fetch)
# origin  git@github.com:user/repo.git (push)

gortex commit
# → Workflow completes
# → Push step attempts push automatically
# → Works seamlessly with SSH keys
```

### Test Case 3: No Remote

```bash
git remote -v
# (empty)

gortex commit
# → Workflow completes
# → Shows "Aucun remote configuré, impossible de push"
```

## Impact

### Breaking Changes

None. This is a bug fix that improves the user experience.

### Behavioral Changes

- **HTTPS remotes**: Push step now skips automatic push and shows guidance
- **SSH remotes**: No change, push works as before
- **No remote**: No change, shows appropriate message

### Benefits

1. **No more hanging**: Workflow completes successfully
2. **Clear guidance**: Users know exactly what to do
3. **Education**: Users learn about SSH and credential helpers
4. **Better UX**: Graceful degradation instead of blocking

## Version

- **Fixed in**: v3.0.1 (pending)
- **Introduced in**: v3.0.0
- **Related issue**: Push step hanging on HTTPS authentication

## Related Documentation

- [GitHub SSH Setup](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Git Credential Storage](https://git-scm.com/docs/gitcredentials)
- [Ink Framework Limitations](https://github.com/vadimdemedes/ink/#israwmodesupported)
