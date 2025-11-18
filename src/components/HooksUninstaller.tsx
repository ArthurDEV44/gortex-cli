import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Confirm } from '../ui/index.js';
import fs from 'fs/promises';
import path from 'path';
import { getGitDir } from '../utils/git.js';

interface HooksUninstallerProps {
  onComplete: (success: boolean) => void;
}

export const HooksUninstaller: React.FC<HooksUninstallerProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [hookExists, setHookExists] = useState(false);
  const [isGortexHook, setIsGortexHook] = useState(false);
  const [hookPath, setHookPath] = useState('');
  const [uninstalling, setUninstalling] = useState(false);

  useEffect(() => {
    const checkHook = async () => {
      try {
        const gitDir = await getGitDir();
        const hookFilePath = path.join(gitDir, 'hooks', 'commit-msg');

        setHookPath(hookFilePath);

        try {
          const content = await fs.readFile(hookFilePath, 'utf-8');
          setHookExists(true);
          setIsGortexHook(content.includes('gortex hook'));
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

    setUninstalling(true);

    try {
      await fs.unlink(hookPath);
      onComplete(true);
    } catch (error: any) {
      console.error('Erreur:', error.message);
      onComplete(false);
    }
  };

  if (loading) {
    return <Text>Vérification des hooks...</Text>;
  }

  if (!hookExists) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">⚠️  Aucun hook commit-msg trouvé</Text>
      </Box>
    );
  }

  if (uninstalling) {
    return <Text>Désinstallation du hook...</Text>;
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">Désinstallation du hook Git</Text>
      </Box>

      {!isGortexHook && (
        <Box marginBottom={1}>
          <Text color="yellow">⚠️  Le hook commit-msg n'a pas été créé par gortex</Text>
        </Box>
      )}

      <Confirm
        message="Voulez-vous quand même le supprimer ?"
        defaultValue={isGortexHook}
        onSubmit={handleConfirm}
      />
    </Box>
  );
};
