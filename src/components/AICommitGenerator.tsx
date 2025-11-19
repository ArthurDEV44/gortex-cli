import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';
import { Confirm } from '../ui/Confirm.js';
import type { AIProvider as AIProviderType, CommitConfig } from '../types.js';
import { useGenerateAICommit } from '../infrastructure/di/hooks.js';
import { AIProviderFactory } from '../infrastructure/factories/AIProviderFactory.js';
import type { CommitMessageDTO } from '../application/dto/CommitMessageDTO.js';
import { icons, commitIcons } from '../theme/colors.js';

type Step = 'generating' | 'preview' | 'error';

interface GeneratedSuggestion {
  commit: CommitMessageDTO;
  formattedMessage: string;
  confidence?: number;
}

interface Props {
  provider: AIProviderType;
  config: CommitConfig;
  onComplete: (message: string | null, fallbackToManual: boolean) => void;
}

export const AICommitGenerator: React.FC<Props> = ({ provider, config, onComplete }) => {
  const generateAICommitUseCase = useGenerateAICommit();

  const [step, setStep] = useState<Step>('generating');
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<GeneratedSuggestion | null>(null);
  const [providerName, setProviderName] = useState<string>('');

  // Start generation on mount
  useEffect(() => {
    generate();
  }, []);

  async function generate() {
    try {
      setStep('generating');

      // Create AI provider instance using factory
      const aiProvider = AIProviderFactory.create(provider as any, config.ai);
      setProviderName(aiProvider.getName());

      // Generate commit message using clean architecture use case
      const result = await generateAICommitUseCase.execute({
        provider: aiProvider,
        includeScope: true,
      });

      if (!result.success || !result.commit) {
        setError(result.error || 'AI generation failed');
        setStep('error');
        return;
      }

      setSuggestion({
        commit: result.commit,
        formattedMessage: result.formattedMessage!,
        confidence: result.confidence,
      });
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
      onComplete(suggestion.formattedMessage, false);
    }
  };

  // Render based on step
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
              {icons.error} Erreur lors de la génération
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
            {suggestion.formattedMessage.split('\n').map((line, i) => (
              <Text key={i}>{line || ' '}</Text>
            ))}
          </Box>

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
  if (confidence >= 80) return icons.star;
  if (confidence >= 60) return icons.success;
  if (confidence >= 40) return icons.info;
  return icons.warning;
}
