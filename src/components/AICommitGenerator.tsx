import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';
import { Confirm } from '../ui/Confirm.js';
import type { AIProvider as AIProviderType, AIGeneratedCommit, CommitConfig } from '../types.js';
import { AICommitService, analyzeStagedChanges } from '../ai/index.js';
import { formatCommitMessage } from '../utils/validate.js';
import { icons, commitIcons } from '../theme/colors.js';

type Step = 'analyzing' | 'generating' | 'preview' | 'error';

interface Props {
  provider: AIProviderType;
  config: CommitConfig;
  onComplete: (message: string | null, fallbackToManual: boolean) => void;
}

export const AICommitGenerator: React.FC<Props> = ({ provider, config, onComplete }) => {
  const [step, setStep] = useState<Step>('analyzing');
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AIGeneratedCommit | null>(null);
  const [providerName, setProviderName] = useState<string>('');

  // Start generation on mount
  useEffect(() => {
    generate();
  }, []);

  async function generate() {
    try {
      // Analyze changes
      setStep('analyzing');
      await analyzeStagedChanges();

      // Generate with AI
      setStep('generating');
      const aiConfig = {
        ...config.ai,
        provider,
        enabled: true,
      };

      const service = new AICommitService({ ...config, ai: aiConfig });
      setProviderName(service.getProviderName());

      const { diff, context } = await analyzeStagedChanges();
      const result = await service.generateCommitMessage(diff, context);

      setSuggestion(result);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep('error');
    }
  }

  const handleConfirm = (confirmed: boolean) => {
    if (!confirmed) {
      // Ask if fallback to manual
      onComplete(null, true);
      return;
    }

    if (suggestion) {
      const message = formatCommitMessage(
        suggestion.type,
        suggestion.scope,
        suggestion.subject,
        suggestion.body,
        suggestion.breaking,
        suggestion.breakingDescription,
      );
      onComplete(message, false);
    }
  };

  // Render based on step
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
            <Spinner type="dots" /> Génération du message avec {providerName}...
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Cela peut prendre quelques secondes...</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box
          borderStyle="round"
          borderColor="red"
          padding={1}
          flexDirection="column"
        >
          <Box marginBottom={1}>
            <Text color="red" bold>
              ✖ Erreur lors de la génération
            </Text>
          </Box>

          <Box marginBottom={1}>
            <Text>{error}</Text>
          </Box>

          <Box>
            <Text dimColor>Retour au mode manuel...</Text>
          </Box>
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
        <Box marginBottom={1}>
          <Gradient name="cristal">
            <Text bold>{commitIcons.feat} Suggestion AI ({providerName})</Text>
          </Gradient>
        </Box>

        <Box
          borderStyle="round"
          borderColor="green"
          padding={1}
          flexDirection="column"
        >
          <Box marginBottom={1}>
            <Text dimColor>Message de commit proposé:</Text>
          </Box>

          <Box
            borderStyle="single"
            borderColor="gray"
            padding={1}
            flexDirection="column"
          >
            {commitMessage.split('\n').map((line, i) => (
              <Text key={i}>{line || ' '}</Text>
            ))}
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
              Confiance: {suggestion.confidence || 50}%{' '}
              {getConfidenceEmoji(suggestion.confidence || 50)}
            </Text>
          </Box>
        </Box>

        <Box marginTop={2}>
          <Confirm
            message="Utiliser cette suggestion ?"
            onSubmit={handleConfirm}
          />
        </Box>

        <Box marginTop={1}>
          <Text dimColor>
            Note: Choisir "Non" vous permettra de créer le message manuellement
          </Text>
        </Box>
      </Box>
    );
  }

  return null;
};

function getConfidenceEmoji(confidence: number): string {
  if (confidence >= 80) return '🎯';
  if (confidence >= 60) return '👍';
  if (confidence >= 40) return '🤔';
  return '⚠️';
}
