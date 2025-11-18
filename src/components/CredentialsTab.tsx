import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import { Confirm } from '../ui/Confirm.js';
import type { AIConfig } from '../types.js';
import { MistralProvider } from '../ai/providers/mistral.js';
import { OpenAIProvider } from '../ai/providers/openai.js';
import { loadConfig } from '../utils/config.js';
import { cosmiconfig } from 'cosmiconfig';
import { writeFile } from 'fs/promises';
import { join } from 'path';

type Step =
  | 'menu'
  | 'mistral-input'
  | 'mistral-test'
  | 'openai-input'
  | 'openai-test'
  | 'save-confirm'
  | 'saving'
  | 'success'
  | 'error';

interface Props {
  onConfigUpdate?: (config: AIConfig) => void;
}

export const CredentialsTab: React.FC<Props> = ({ onConfigUpdate }) => {
  const [step, setStep] = useState<Step>('menu');
  const [mistralKey, setMistralKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'testing' | 'success' | 'failed'>('testing');
  const [currentConfig, setCurrentConfig] = useState<AIConfig | null>(null);

  // Load existing config
  useEffect(() => {
    loadConfig().then((config) => {
      if (config.ai) {
        setCurrentConfig(config.ai);
        setMistralKey(config.ai.mistral?.apiKey || '');
        setOpenaiKey(config.ai.openai?.apiKey || '');
      }
    });
  }, []);

  const handleMistralTest = async () => {
    setStep('mistral-test');
    setTestStatus('testing');

    try {
      const provider = new MistralProvider({
        mistral: { apiKey: mistralKey },
      } as AIConfig);

      const available = await provider.isAvailable();
      if (available) {
        setTestStatus('success');
        setTimeout(() => setStep('menu'), 2000);
      } else {
        setTestStatus('failed');
        setError('API Mistral non accessible. Vérifiez votre clé.');
        setTimeout(() => setStep('menu'), 3000);
      }
    } catch (err) {
      setTestStatus('failed');
      setError(err instanceof Error ? err.message : String(err));
      setTimeout(() => setStep('menu'), 3000);
    }
  };

  const handleOpenAITest = async () => {
    setStep('openai-test');
    setTestStatus('testing');

    try {
      const provider = new OpenAIProvider({
        openai: { apiKey: openaiKey },
      } as AIConfig);

      const available = await provider.isAvailable();
      if (available) {
        setTestStatus('success');
        setTimeout(() => setStep('menu'), 2000);
      } else {
        setTestStatus('failed');
        setError('API OpenAI non accessible. Vérifiez votre clé.');
        setTimeout(() => setStep('menu'), 3000);
      }
    } catch (err) {
      setTestStatus('failed');
      setError(err instanceof Error ? err.message : String(err));
      setTimeout(() => setStep('menu'), 3000);
    }
  };

  const handleSave = async (confirmed: boolean) => {
    if (!confirmed) {
      setStep('menu');
      return;
    }

    setStep('saving');

    try {
      const configPath = join(process.cwd(), '.gortexrc');
      const explorer = cosmiconfig('gortex');
      const existing = await explorer.search();

      const newConfig = {
        ...(existing?.config || {}),
        ai: {
          ...(existing?.config?.ai || {}),
          enabled: true,
          mistral: {
            ...(existing?.config?.ai?.mistral || {}),
            apiKey: mistralKey || undefined,
          },
          openai: {
            ...(existing?.config?.ai?.openai || {}),
            apiKey: openaiKey || undefined,
          },
        },
      };

      await writeFile(configPath, JSON.stringify(newConfig, null, 2));

      setStep('success');
      if (onConfigUpdate) {
        onConfigUpdate(newConfig.ai);
      }

      setTimeout(() => setStep('menu'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep('error');
      setTimeout(() => setStep('menu'), 3000);
    }
  };

  // Render based on step
  if (step === 'mistral-input') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            🔑 Configuration Mistral AI
          </Text>
        </Box>

        <Box marginBottom={1}>
          <Text dimColor>
            Entrez votre clé API Mistral (obtenue sur https://console.mistral.ai/)
          </Text>
        </Box>

        <Box>
          <Text color="cyan">API Key: </Text>
          <TextInput
            value={mistralKey}
            onChange={setMistralKey}
            onSubmit={() => {
              if (mistralKey.trim()) {
                handleMistralTest();
              }
            }}
            mask="*"
          />
        </Box>

        <Box marginTop={1}>
          <Text dimColor>enter valider • esc retour</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'mistral-test' || step === 'openai-test') {
    const provider = step === 'mistral-test' ? 'Mistral AI' : 'OpenAI';

    return (
      <Box flexDirection="column" padding={1}>
        {testStatus === 'testing' && (
          <Box>
            <Text color="cyan">
              <Spinner type="dots" /> Test de connexion à {provider}...
            </Text>
          </Box>
        )}

        {testStatus === 'success' && (
          <Box>
            <Text color="green" bold>
              ✓ Connexion réussie à {provider} !
            </Text>
          </Box>
        )}

        {testStatus === 'failed' && (
          <Box flexDirection="column">
            <Box>
              <Text color="red" bold>
                ✖ Échec de connexion à {provider}
              </Text>
            </Box>
            {error && (
              <Box marginTop={1}>
                <Text dimColor>{error}</Text>
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  }

  if (step === 'openai-input') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            🔑 Configuration OpenAI
          </Text>
        </Box>

        <Box marginBottom={1}>
          <Text dimColor>
            Entrez votre clé API OpenAI (obtenue sur https://platform.openai.com/)
          </Text>
        </Box>

        <Box>
          <Text color="cyan">API Key: </Text>
          <TextInput
            value={openaiKey}
            onChange={setOpenaiKey}
            onSubmit={() => {
              if (openaiKey.trim()) {
                handleOpenAITest();
              }
            }}
            mask="*"
          />
        </Box>

        <Box marginTop={1}>
          <Text dimColor>enter valider • esc retour</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'save-confirm') {
    return (
      <Box flexDirection="column" padding={1}>
        <Confirm
          message="Sauvegarder les clés API dans .gortexrc ?"
          onSubmit={handleSave}
        />
      </Box>
    );
  }

  if (step === 'saving') {
    return (
      <Box padding={1}>
        <Text color="cyan">
          <Spinner type="dots" /> Sauvegarde de la configuration...
        </Text>
      </Box>
    );
  }

  if (step === 'success') {
    return (
      <Box padding={1}>
        <Text color="green" bold>
          ✓ Configuration sauvegardée dans .gortexrc
        </Text>
      </Box>
    );
  }

  if (step === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box>
          <Text color="red" bold>
            ✖ Erreur lors de la sauvegarde
          </Text>
        </Box>
        {error && (
          <Box marginTop={1}>
            <Text dimColor>{error}</Text>
          </Box>
        )}
      </Box>
    );
  }

  // Menu principal - render read-only status for now
  return (
    <Box flexDirection="column" padding={1}>
      <Box
        borderStyle="round"
        borderColor="cyan"
        padding={1}
        flexDirection="column"
      >
        <Box marginBottom={1}>
          <Text bold color="cyan">
            🔑 Gestion des Credentials AI
          </Text>
        </Box>

        {/* Status actuel */}
        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text>
              Mistral AI:{' '}
              {mistralKey ? (
                <Text color="green">✓ Configuré</Text>
              ) : (
                <Text color="red">✖ Non configuré</Text>
              )}
            </Text>
          </Box>
          <Box>
            <Text>
              OpenAI:{' '}
              {openaiKey ? (
                <Text color="green">✓ Configuré</Text>
              ) : (
                <Text color="red">✖ Non configuré</Text>
              )}
            </Text>
          </Box>
        </Box>

        {/* Info message */}
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>
            Pour configurer les API keys, ajoutez-les dans votre .gortexrc :
          </Text>
          <Box marginTop={1} paddingLeft={2} flexDirection="column">
            <Text dimColor>{'{'}</Text>
            <Text dimColor>  "ai": {'{'}</Text>
            <Text dimColor>    "mistral": {'{'}</Text>
            <Text dimColor>      "apiKey": "votre_cle_mistral"</Text>
            <Text dimColor>    {'}'},</Text>
            <Text dimColor>    "openai": {'{'}</Text>
            <Text dimColor>      "apiKey": "votre_cle_openai"</Text>
            <Text dimColor>    {'}'}</Text>
            <Text dimColor>  {'}'}</Text>
            <Text dimColor>{'}'}</Text>
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text dimColor>
            Ou utilisez les variables d'environnement: MISTRAL_API_KEY, OPENAI_API_KEY
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          Note: Ollama (local) ne nécessite pas de clé API
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color="cyan">
          Basculez vers l'onglet Commit (tab ou →) pour créer vos commits
        </Text>
      </Box>
    </Box>
  );
};
