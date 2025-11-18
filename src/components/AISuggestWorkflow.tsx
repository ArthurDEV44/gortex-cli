import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { CommitConfig, AIGeneratedCommit } from '../types.js';
import { AICommitService, analyzeStagedChanges } from '../ai/index.js';
import { ErrorMessage } from './ErrorMessage.js';
import { formatCommitMessage } from '../utils/validate.js';
import { Confirm } from '../ui/Confirm.js';
import { isGitRepository, createCommit } from '../utils/git.js';
import { commitIcons } from '../theme/colors.js';

interface Props {
  config: CommitConfig;
}

type Step =
  | 'checking'
  | 'analyzing'
  | 'generating'
  | 'preview'
  | 'confirming'
  | 'committing'
  | 'success'
  | 'error';

export function AISuggestWorkflow({ config }: Props) {
  const [step, setStep] = useState<Step>('checking');
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AIGeneratedCommit | null>(null);
  const [providerName, setProviderName] = useState<string>('');
  const [useConfidence, setUseConfidence] = useState<number>(0);

  // Étape 1: Vérifications initiales
  useEffect(() => {
    if (step === 'checking') {
      checkEnvironment();
    }
  }, [step]);

  async function checkEnvironment() {
    try {
      // Vérifie qu'on est dans un repo git
      const isGit = await isGitRepository();
      if (!isGit) {
        setError('Vous devez être dans un dépôt Git pour utiliser cette commande.');
        setStep('error');
        return;
      }

      setStep('analyzing');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep('error');
    }
  }

  // Étape 2: Analyse des changements
  useEffect(() => {
    if (step === 'analyzing') {
      analyzeChanges();
    }
  }, [step]);

  async function analyzeChanges() {
    try {
      await analyzeStagedChanges();
      setStep('generating');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep('error');
    }
  }

  // Étape 3: Génération avec AI
  useEffect(() => {
    if (step === 'generating') {
      generateSuggestion();
    }
  }, [step]);

  async function generateSuggestion() {
    try {
      const service = new AICommitService(config);
      setProviderName(service.getProviderName());

      // Vérifie disponibilité
      const available = await service.isAvailable();
      if (!available) {
        setError(`Provider ${service.getProviderName()} non disponible. Vérifiez votre configuration.`);
        setStep('error');
        return;
      }

      // Analyse et génère
      const { diff, context } = await analyzeStagedChanges();
      const result = await service.generateCommitMessage(diff, context);

      setSuggestion(result);
      setUseConfidence(result.confidence || 50);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep('error');
    }
  }

  // Rendu selon l'étape
  if (step === 'error') {
    setTimeout(() => process.exit(1), 2000);
    return (
      <ErrorMessage
        title="Erreur"
        message={error || 'Une erreur est survenue'}
      />
    );
  }

  if (step === 'checking') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box>
          <Text color="cyan">
            <Spinner type="dots" /> Vérification de l'environnement...
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'analyzing') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box>
          <Text color="cyan">
            <Spinner type="dots" /> Analyse des changements stagés...
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'generating') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box>
          <Text color="magenta">
            <Spinner type="dots" /> Génération du message avec {providerName || 'AI'}...
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Cela peut prendre quelques secondes...</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'preview' && suggestion) {
    const commitMessage = formatCommitMessage(
      suggestion.type,
      suggestion.scope,
      suggestion.subject,
      suggestion.body,
      suggestion.breaking,
      suggestion.breakingDescription,
    );

    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="round" borderColor="green" padding={1} flexDirection="column">
          <Box marginBottom={1}>
            <Text bold color="green">
              {commitIcons.feat} Suggestion générée par {providerName}
            </Text>
          </Box>

          <Box flexDirection="column" marginBottom={1}>
            <Text dimColor>Message de commit proposé:</Text>
            <Box marginTop={1} paddingLeft={2} flexDirection="column">
              <Text>{commitMessage}</Text>
            </Box>
          </Box>

          {suggestion.reasoning && (
            <Box flexDirection="column" marginTop={1}>
              <Text dimColor>Raisonnement:</Text>
              <Box paddingLeft={2} marginTop={1}>
                <Text italic>{suggestion.reasoning}</Text>
              </Box>
            </Box>
          )}

          <Box marginTop={1}>
            <Text dimColor>
              Confiance: {useConfidence}% {getConfidenceEmoji(useConfidence)}
            </Text>
          </Box>
        </Box>

        <Box marginTop={2}>
          <Confirm
            message="Utiliser cette suggestion pour créer le commit ?"
            onSubmit={handleConfirm}
          />
        </Box>
      </Box>
    );
  }

  if (step === 'committing') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box>
          <Text color="cyan">
            <Spinner type="dots" /> Création du commit...
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'success' && suggestion) {
    const commitMessage = formatCommitMessage(
      suggestion.type,
      suggestion.scope,
      suggestion.subject,
      suggestion.body,
      suggestion.breaking,
      suggestion.breakingDescription,
    );

    return (
      <Box flexDirection="column" padding={1}>
        <Box>
          <Text color="green" bold>
            ✓ Commit créé avec succès !
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>{commitMessage.split('\n')[0]}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Généré par {providerName}</Text>
        </Box>
      </Box>
    );
  }

  return null;

  async function handleConfirm(confirmed: boolean) {
    if (!confirmed || !suggestion) {
      process.exit(0);
      return;
    }

    setStep('committing');

    try {
      const commitMessage = formatCommitMessage(
        suggestion.type,
        suggestion.scope,
        suggestion.subject,
        suggestion.body,
        suggestion.breaking,
        suggestion.breakingDescription,
      );

      await createCommit(commitMessage);
      setStep('success');

      // Attendre un peu avant de quitter
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep('error');
    }
  }
}

function getConfidenceEmoji(confidence: number): string {
  if (confidence >= 80) return '🎯';
  if (confidence >= 60) return '👍';
  if (confidence >= 40) return '🤔';
  return '⚠️';
}
