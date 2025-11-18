import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { Confirm } from '../ui/index.js';
import { hasRemote, getDefaultRemote, hasUpstream, pushToRemote, getRemoteUrl } from '../utils/git.js';
import { icons } from '../theme/colors.js';

interface PushPromptProps {
  branch: string;
  onComplete: () => void;
}

type PushStep = 'checking' | 'no-remote' | 'confirm' | 'pushing' | 'success' | 'error';

export const PushPrompt: React.FC<PushPromptProps> = ({ branch, onComplete }) => {
  const [step, setStep] = useState<PushStep>('checking');
  const [remoteUrl, setRemoteUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkRemote = async () => {
      const exists = await hasRemote();

      if (!exists) {
        setStep('no-remote');
        return;
      }

      const remote = await getDefaultRemote();
      const url = await getRemoteUrl(remote);
      setRemoteUrl(url || '');
      setStep('confirm');
    };
    checkRemote();
  }, []);

  // Handler pour push avec les credentials Git natifs
  const handlePush = async () => {
    setStep('pushing');

    try {
      const remote = await getDefaultRemote();
      const upstream = await hasUpstream();

      // Push normal (utilise les credentials Git de l'utilisateur)
      await pushToRemote(remote, branch, !upstream);

      setStep('success');
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      setStep('error');
    }
  };

  // Handler pour confirmer le push
  const handleConfirm = async (shouldPush: boolean) => {
    if (!shouldPush) {
      onComplete();
      return;
    }
    await handlePush();
  };

  // Vérification en cours
  if (step === 'checking') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="blue">{icons.push} Étape 5/5: Push vers le remote</Text>
        </Box>
        <Text color="cyan">
          <Spinner type="dots" /> Vérification du remote...
        </Text>
      </Box>
    );
  }

  // Pas de remote
  if (step === 'no-remote') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="blue">{icons.push} Étape 5/5: Push vers le remote</Text>
        </Box>
        <Text color="yellow">⚠️  Aucun remote configuré, impossible de push</Text>
        <Box marginTop={1}>
          <Text dimColor>{icons.info} Configurez un remote avec : git remote add origin &lt;url&gt;</Text>
        </Box>
      </Box>
    );
  }

  // Demander confirmation avant push
  if (step === 'confirm') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="blue">{icons.push} Étape 5/5: Push vers le remote</Text>
        </Box>
        <Box marginBottom={1}>
          <Text>Remote: <Text dimColor>{remoteUrl}</Text></Text>
        </Box>
        <Confirm message="Voulez-vous push vers le remote ?" defaultValue={true} onSubmit={handleConfirm} />
      </Box>
    );
  }

  // Push en cours
  if (step === 'pushing') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="blue">{icons.push} Étape 5/5: Push vers le remote</Text>
        </Box>
        <Text color="cyan">
          <Spinner type="dots" /> Push en cours vers {remoteUrl}...
        </Text>
      </Box>
    );
  }

  // Succès
  if (step === 'success') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="blue">{icons.push} Étape 5/5: Push vers le remote</Text>
        </Box>
        <Text color="green">✓ Push réussi vers {remoteUrl}</Text>
      </Box>
    );
  }

  // Erreur
  if (step === 'error') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="blue">{icons.push} Étape 5/5: Push vers le remote</Text>
        </Box>
        <Text color="red">{icons.error} Erreur lors du push: {error}</Text>
        <Box marginTop={1} flexDirection="column">
          <Text color="yellow">{icons.info} Push manuellement avec: git push origin {branch}</Text>
          <Box marginTop={1}>
            <Text dimColor bold>Configuration requise :</Text>
          </Box>
          <Text dimColor>• SSH (recommandé) : https://docs.github.com/en/authentication/connecting-to-github-with-ssh</Text>
          <Text dimColor>• HTTPS : git config --global credential.helper store</Text>
        </Box>
      </Box>
    );
  }

  return null;
};
