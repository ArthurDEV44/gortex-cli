import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Confirm } from '../ui/index.js';
import { hasRemote, getDefaultRemote, hasUpstream, pushToRemote, isHttpsRemote, getRemoteUrl } from '../utils/git.js';
import chalk from 'chalk';

interface PushPromptProps {
  branch: string;
  onComplete: () => void;
}

export const PushPrompt: React.FC<PushPromptProps> = ({ branch, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [remoteExists, setRemoteExists] = useState(false);
  const [isHttps, setIsHttps] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState<string>('');
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <Box marginTop={1}>
          <Text dimColor>💡 Continuez manuellement avec : git push</Text>
        </Box>
      </Box>
    );
  }

  // Si le remote est en HTTPS, on ne peut pas gérer l'authentification interactive
  // On affiche un message et on skip le push
  if (isHttps) {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="blue">🚀 Étape 5/5: Push vers le remote</Text>
        </Box>
        <Box flexDirection="column" marginBottom={1}>
          <Text color="yellow">⚠️  Remote HTTPS détecté</Text>
          <Text dimColor>URL: {remoteUrl}</Text>
        </Box>
        <Box flexDirection="column" marginBottom={1} paddingLeft={2}>
          <Text>L'interface interactive ne peut pas gérer l'authentification HTTPS.</Text>
          <Text>Veuillez push manuellement avec :</Text>
        </Box>
        <Box flexDirection="column" paddingLeft={4} marginBottom={1}>
          <Text bold color="cyan">git push origin {branch}</Text>
        </Box>
        <Box flexDirection="column" paddingLeft={2} marginTop={1}>
          <Text bold>💡 Pour éviter ce problème à l'avenir :</Text>
          <Text dimColor>• Option 1 : Configurez SSH (recommandé)</Text>
          <Text dimColor>  → https://docs.github.com/en/authentication/connecting-to-github-with-ssh</Text>
          <Text dimColor>• Option 2 : Configurez un credential helper</Text>
          <Text dimColor>  → git config --global credential.helper store</Text>
        </Box>
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
