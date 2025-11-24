import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { useEffect, useState } from "react";
import { usePushOperations } from "../infrastructure/di/hooks.js";
import { UI_DELAYS } from "../shared/constants/index.js";
import { colors, icons } from "../theme/colors.js";
import { Confirm } from "../ui/index.js";

interface PushPromptProps {
  branch: string;
  onComplete: () => void;
}

type PushStep =
  | "checking"
  | "no-remote"
  | "confirm"
  | "pushing"
  | "success"
  | "error";

export const PushPrompt = ({ branch, onComplete }: PushPromptProps) => {
  const pushOperationsUseCase = usePushOperations();

  const [step, setStep] = useState<PushStep>("checking");
  const [remoteUrl, setRemoteUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkRemote = async () => {
      // Use clean architecture use case to check remote
      const result = await pushOperationsUseCase.checkRemote();

      if (!result.success) {
        setError(result.error || "Failed to check remote");
        setStep("error");
        return;
      }

      if (!result.hasRemote) {
        setStep("no-remote");
        return;
      }

      setRemoteUrl(result.remoteUrl || "");
      setStep("confirm");
    };
    checkRemote();
  }, [pushOperationsUseCase.checkRemote]);

  // Handler pour push avec les credentials Git natifs
  const handlePush = async () => {
    setStep("pushing");

    try {
      // Use clean architecture use case to push to remote
      const result = await pushOperationsUseCase.pushToRemote({ branch });

      if (!result.success) {
        setError(result.error || "Failed to push to remote");
        setStep("error");
        return;
      }

      setStep("success");
      setTimeout(() => {
        onComplete();
      }, UI_DELAYS.INTRO);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setStep("error");
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
  if (step === "checking") {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            {icons.push} Étape 5/5: Push vers le remote
          </Text>
        </Box>
        <Text color={colors.info}>
          <Spinner type="dots" /> Vérification du remote...
        </Text>
      </Box>
    );
  }

  // Pas de remote
  if (step === "no-remote") {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            {icons.push} Étape 5/5: Push vers le remote
          </Text>
        </Box>
        <Text color={colors.warning}>
          {icons.warning} Aucun remote configuré, impossible de push
        </Text>
        <Box marginTop={1}>
          <Text dimColor>
            {icons.info} Configurez un remote avec : git remote add origin
            &lt;url&gt;
          </Text>
        </Box>
      </Box>
    );
  }

  // Demander confirmation avant push
  if (step === "confirm") {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            {icons.push} Étape 5/5: Push vers le remote
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text>
            Remote: <Text dimColor>{remoteUrl}</Text>
          </Text>
        </Box>
        <Confirm
          message="Voulez-vous push vers le remote ?"
          defaultValue={true}
          onSubmit={handleConfirm}
        />
      </Box>
    );
  }

  // Push en cours
  if (step === "pushing") {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            {icons.push} Étape 5/5: Push vers le remote
          </Text>
        </Box>
        <Text color={colors.info}>
          <Spinner type="dots" /> Push en cours vers {remoteUrl}...
        </Text>
      </Box>
    );
  }

  // Succès
  if (step === "success") {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            {icons.push} Étape 5/5: Push vers le remote
          </Text>
        </Box>
        <Text color={colors.success}>
          {icons.success} Push réussi vers {remoteUrl}
        </Text>
      </Box>
    );
  }

  // Erreur
  if (step === "error") {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            {icons.push} Étape 5/5: Push vers le remote
          </Text>
        </Box>
        <Text color={colors.error}>
          {icons.error} Erreur lors du push: {error}
        </Text>
        <Box marginTop={1} flexDirection="column">
          <Text color={colors.warning}>
            {icons.info} Push manuellement avec: git push origin {branch}
          </Text>
          <Box marginTop={1}>
            <Text dimColor bold>
              Configuration requise :
            </Text>
          </Box>
          <Text dimColor>
            • SSH (recommandé) :
            https://docs.github.com/en/authentication/connecting-to-github-with-ssh
          </Text>
          <Text dimColor>
            • HTTPS : git config --global credential.helper store
          </Text>
        </Box>
      </Box>
    );
  }

  return null;
};
