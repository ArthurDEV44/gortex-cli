import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Confirm } from '../ui/index.js';
import fs from 'fs/promises';
import path from 'path';
import { getGitDir } from '../utils/git.js';

const COMMIT_MSG_HOOK = `#!/bin/sh
# gortex hook - valide le format des commits

# Lire le message de commit
commit_msg_file=$1
commit_msg=$(cat "$commit_msg_file")

# Pattern pour commits conventionnels
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\\(.+\\))?!?: .{3,}"

if ! echo "$commit_msg" | grep -qE "$pattern"; then
    echo ""
    echo "❌ Erreur: Le message de commit ne suit pas le format conventionnel"
    echo ""
    echo "Format attendu: <type>(<scope>): <description>"
    echo ""
    echo "Types valides: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
    echo ""
    echo "Exemples:"
    echo "  feat(auth): add login functionality"
    echo "  fix: resolve crash on startup"
    echo "  docs(readme): update installation steps"
    echo ""
    echo "💡 Utilisez 'npx gortex' pour créer un commit guidé"
    echo ""
    exit 1
fi
`;

interface HooksInstallerProps {
  onComplete: (success: boolean) => void;
}

export const HooksInstaller: React.FC<HooksInstallerProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [hookExists, setHookExists] = useState(false);
  const [hookPath, setHookPath] = useState('');
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const checkHook = async () => {
      try {
        const gitDir = await getGitDir();
        const hooksDir = path.join(gitDir, 'hooks');
        const hookFilePath = path.join(hooksDir, 'commit-msg');

        setHookPath(hookFilePath);

        try {
          await fs.access(hookFilePath);
          setHookExists(true);
        } catch {
          setHookExists(false);
        }

        setLoading(false);
      } catch (error) {
        onComplete(false);
      }
    };
    checkHook();
  }, [onComplete]);

  const handleConfirm = async (confirmed: boolean) => {
    if (!confirmed) {
      onComplete(false);
      return;
    }

    setInstalling(true);

    try {
      const gitDir = await getGitDir();
      const hooksDir = path.join(gitDir, 'hooks');

      await fs.mkdir(hooksDir, { recursive: true });
      await fs.writeFile(hookPath, COMMIT_MSG_HOOK, { mode: 0o755 });

      onComplete(true);
    } catch (error: any) {
      console.error('Erreur:', error.message);
      onComplete(false);
    }
  };

  if (loading) {
    return <Text>Vérification des hooks...</Text>;
  }

  if (installing) {
    return <Text>Installation du hook...</Text>;
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">Installation du hook Git</Text>
      </Box>

      {hookExists && (
        <Box marginBottom={1}>
          <Text color="yellow">⚠️  Un hook commit-msg existe déjà</Text>
        </Box>
      )}

      <Confirm
        message={hookExists ? 'Voulez-vous le remplacer ?' : 'Installer le hook commit-msg ?'}
        defaultValue={!hookExists}
        onSubmit={handleConfirm}
      />
    </Box>
  );
};
