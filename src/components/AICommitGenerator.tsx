import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { useCallback, useEffect, useState } from "react";
import type { CommitMessageDTO } from "../application/dto/CommitMessageDTO.js";
import { useGenerateAICommit } from "../infrastructure/di/hooks.js";
import { AIProviderFactory } from "../infrastructure/factories/AIProviderFactory.js";
import { colors, commitIcons, createGradient, icons } from "../theme/colors.js";
import type { AIProvider as AIProviderType, CommitConfig } from "../types.js";
import { Confirm } from "../ui/Confirm.js";

type Step = "generating" | "preview" | "error";

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

export const AICommitGenerator = ({ provider, config, onComplete }: Props) => {
  const generateAICommitUseCase = useGenerateAICommit();

  const [step, setStep] = useState<Step>("generating");
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<GeneratedSuggestion | null>(
    null,
  );
  const [providerName, setProviderName] = useState<string>("");

  const generate = useCallback(async () => {
    try {
      setStep("generating");

      // Create AI provider instance using factory
      // biome-ignore lint/suspicious/noExplicitAny: Type narrowing needed because provider can be 'disabled' but factory requires non-disabled type
      const aiProvider = AIProviderFactory.create(provider as any, config.ai);
      setProviderName(aiProvider.getName());

      // Generate commit message using clean architecture use case
      const result = await generateAICommitUseCase.execute({
        provider: aiProvider,
        includeScope: true,
      });

      if (!result.success || !result.commit || !result.formattedMessage) {
        setError(result.error || "AI generation failed");
        setStep("error");
        return;
      }

      setSuggestion({
        commit: result.commit,
        formattedMessage: result.formattedMessage,
        confidence: result.confidence,
      });
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  }, [provider, config, generateAICommitUseCase]);

  // Start generation on mount
  useEffect(() => {
    generate();
  }, [generate]);

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
  if (step === "generating") {
    return (
      <Box flexDirection="column" padding={1}>
        <Box>
          <Text color={colors.secondary}>
            <Spinner type="dots" /> Génération du message avec{" "}
            {providerName || "AI"}...
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Cela peut prendre quelques secondes...</Text>
        </Box>
      </Box>
    );
  }

  if (step === "error") {
    return (
      <Box flexDirection="column" padding={1}>
        <Box
          borderStyle="round"
          borderColor={colors.error}
          padding={1}
          flexDirection="column"
        >
          <Box marginBottom={1}>
            <Text color={colors.error} bold>
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

  if (step === "preview" && suggestion) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold>
            {createGradient.commitMessage(
              `${commitIcons.feat} Suggestion AI (${providerName})`,
            )}
          </Text>
        </Box>

        <Box
          borderStyle="round"
          borderColor={colors.border}
          paddingX={2}
          paddingY={1}
          flexDirection="column"
        >
          <Box marginBottom={1}>
            <Text dimColor>Message de commit proposé:</Text>
          </Box>

          <Box marginBottom={1}>
            <Text bold>
              {createGradient.commitMessage(suggestion.formattedMessage)}
            </Text>
          </Box>

          {suggestion.confidence !== undefined && (
            <Box>
              <Text dimColor>
                Confiance: {suggestion.confidence}%{" "}
                {getConfidenceEmoji(suggestion.confidence)}
              </Text>
            </Box>
          )}
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
