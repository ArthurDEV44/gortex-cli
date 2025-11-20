/**
 * Commit Mode Selector Component
 * Note: Uses AI providers directly to check availability.
 * This is acceptable as these are the concrete implementations used by infrastructure adapters.
 */

import { Box, Text } from "ink";
import Gradient from "ink-gradient";
import { useEffect, useState } from "react";
import { MistralProvider } from "../ai/providers/mistral.js";
import { OllamaProvider } from "../ai/providers/ollama.js";
import { OpenAIProvider } from "../ai/providers/openai.js";
import { icons } from "../theme/colors.js";
import type { AIProvider as AIProviderType, CommitConfig } from "../types.js";
import { Select, type SelectItem } from "../ui/Select.js";

export type CommitMode = "ai" | "manual";

interface Props {
  config: CommitConfig;
  onComplete: (mode: CommitMode, provider?: AIProviderType) => void;
}

export const CommitModeSelector = ({ config, onComplete }: Props) => {
  const [availableProviders, setAvailableProviders] = useState<{
    ollama: boolean;
    mistral: boolean;
    openai: boolean;
  }>({
    ollama: false,
    mistral: false,
    openai: false,
  });

  const [checking, setChecking] = useState(true);

  // Check provider availability
  useEffect(() => {
    async function checkProviders() {
      const results = {
        ollama: false,
        mistral: false,
        openai: false,
      };

      // Check Ollama
      try {
        const ollama = new OllamaProvider(config.ai || {});
        results.ollama = await ollama.isAvailable();
      } catch {}

      // Check Mistral
      if (config.ai?.mistral?.apiKey || process.env.MISTRAL_API_KEY) {
        try {
          const mistral = new MistralProvider(config.ai || {});
          results.mistral = await mistral.isAvailable();
        } catch {}
      }

      // Check OpenAI
      if (config.ai?.openai?.apiKey || process.env.OPENAI_API_KEY) {
        try {
          const openai = new OpenAIProvider(config.ai || {});
          results.openai = await openai.isAvailable();
        } catch {}
      }

      setAvailableProviders(results);
      setChecking(false);
    }

    checkProviders();
  }, [config]);

  if (checking) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Gradient name="cristal">
            <Text bold>{icons.settings} Mode de Génération du Commit</Text>
          </Gradient>
        </Box>

        <Box>
          <Text dimColor>Vérification des providers AI disponibles...</Text>
        </Box>
      </Box>
    );
  }

  // Build options based on availability
  const aiProviders: SelectItem[] = [];

  if (availableProviders.ollama) {
    aiProviders.push({
      label: `${icons.settings} AI - Ollama (Local)`,
      value: "ollama",
      description: `Génération avec Ollama - ${config.ai?.ollama?.model || "mistral:7b"}`,
    });
  }

  if (availableProviders.mistral) {
    aiProviders.push({
      label: `${icons.settings} AI - Mistral`,
      value: "mistral",
      description: `Génération avec Mistral AI - ${config.ai?.mistral?.model || "mistral-small-latest"}`,
    });
  }

  if (availableProviders.openai) {
    aiProviders.push({
      label: `${icons.settings} AI - OpenAI`,
      value: "openai",
      description: `Génération avec OpenAI - ${config.ai?.openai?.model || "gpt-4o-mini"}`,
    });
  }

  // Always add manual option
  const options: SelectItem[] = [
    ...aiProviders,
    {
      label: `${icons.step} Manuel`,
      value: "manual",
      description: "Créer le message manuellement (mode classique)",
    },
  ];

  // If no AI providers, show warning
  const hasAIProviders = aiProviders.length > 0;

  const handleSelect = (selected: SelectItem) => {
    if (selected.value === "manual") {
      onComplete("manual");
    } else {
      onComplete("ai", selected.value as AIProviderType);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Gradient name="cristal">
          <Text bold>🤖 Mode de Génération du Commit</Text>
        </Gradient>
      </Box>

      {!hasAIProviders && (
        <Box
          borderStyle="round"
          borderColor="yellow"
          padding={1}
          marginBottom={1}
          flexDirection="column"
        >
          <Box marginBottom={1}>
            <Text color="yellow" bold>
              {icons.warning} Aucun provider AI disponible
            </Text>
          </Box>

          <Box flexDirection="column">
            <Text dimColor>Pour utiliser l'IA, configurez un provider:</Text>
            <Box marginTop={1}>
              <Text dimColor>
                • <Text color="cyan">Ollama</Text>: Installez Ollama et lancez
                "ollama pull mistral:7b"
              </Text>
            </Box>
            <Box>
              <Text dimColor>
                • <Text color="cyan">Mistral/OpenAI</Text>: Configurez votre API
                key dans l'onglet Credentials
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      <Select
        message="Choisissez le mode de génération"
        items={options}
        onSelect={handleSelect}
      />

      <Box marginTop={1}>
        <Text dimColor>
          {hasAIProviders
            ? `${aiProviders.length} provider(s) AI disponible(s)`
            : "Mode manuel uniquement"}
        </Text>
      </Box>
    </Box>
  );
};
