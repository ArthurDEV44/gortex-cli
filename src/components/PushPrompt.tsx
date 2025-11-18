import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Confirm } from '../ui/index.js';
import { hasRemote, getDefaultRemote, hasUpstream, pushToRemote } from '../utils/git.js';
import chalk from 'chalk';

interface PushPromptProps {
  branch: string;
  onComplete: () => void;
}

export const PushPrompt: React.FC<PushPromptProps> = ({ branch, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [remoteExists, setRemoteExists] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkRemote = async () => {
      const exists = await hasRemote();
      setRemoteExists(exists);
      setLoading(false);
    };
    checkRemote();
  }, []);

  if (loading) {
    return <Text>Vérification du remote...</Text>;
  }

  if (!remoteExists) {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="blue">🚀 Étape 5/5: Push vers le remote</Text>
        </Box>
        <Text color="yellow">⚠️  Aucun remote configuré, impossible de push</Text>
      </Box>
    );
  }

  const handleConfirm = async (shouldPush: boolean) => {
    if (!shouldPush) {
      onComplete();
      return;
    }

    setPushing(true);

    try {
      const remote = await getDefaultRemote();
      const upstream = await hasUpstream();

      if (upstream) {
        await pushToRemote(remote, branch, false);
      } else {
        await pushToRemote(remote, branch, true);
      }

      onComplete();
    } catch (err: any) {
      setError(err.message);
      setPushing(false);
    }
  };

  if (pushing) {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="blue">🚀 Étape 5/5: Push vers le remote</Text>
        </Box>
        <Text>Push en cours...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="blue">🚀 Étape 5/5: Push vers le remote</Text>
        </Box>
        <Text color="red">❌ Erreur lors du push: {error}</Text>
        <Text color="yellow">💡 Vous pouvez push manuellement avec: git push</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="blue">🚀 Étape 5/5: Push vers le remote</Text>
      </Box>
      <Confirm message="Voulez-vous push vers le remote ?" defaultValue={true} onSubmit={handleConfirm} />
    </Box>
  );
};
