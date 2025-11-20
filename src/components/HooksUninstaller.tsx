import fs from "node:fs/promises";
import path from "node:path";
import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { useGitRepository } from "../infrastructure/di/hooks.js";
import { icons } from "../theme/colors.js";
import { Confirm } from "../ui/index.js";

interface HooksUninstallerProps {
  onComplete: (success: boolean) => void;
}

export const HooksUninstaller = ({ onComplete }: HooksUninstallerProps) => {
  const gitRepository = useGitRepository();
  const [loading, setLoading] = useState(true);
  const [hookExists, setHookExists] = useState(false);
  const [isGortexHook, setIsGortexHook] = useState(false);
  const [hookPath, setHookPath] = useState("");
  const [uninstalling, setUninstalling] = useState(false);

  useEffect(() => {
    const checkHook = async () => {
      try {
        const gitDir = await gitRepository.getGitDirectory();
        const hookFilePath = path.join(gitDir, "hooks", "commit-msg");

        setHookPath(hookFilePath);

        try {
          const content = await fs.readFile(hookFilePath, "utf-8");
          setHookExists(true);
          setIsGortexHook(content.includes("gortex hook"));
        } catch {
          setHookExists(false);
        }

        setLoading(false);
      } catch (_error) {
        onComplete(false);
      }
    };
    checkHook();
  }, [onComplete, gitRepository]);

  const handleConfirm = async (confirmed: boolean) => {
    if (!confirmed) {
      onComplete(false);
      return;
    }

    setUninstalling(true);

    try {
      await fs.unlink(hookPath);
      onComplete(true);
    } catch (error: unknown) {
      console.error(
        "Erreur:",
        error instanceof Error ? error.message : String(error),
      );
      onComplete(false);
    }
  };

  if (loading) {
    return <Text>Vérification des hooks...</Text>;
  }

  if (!hookExists) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">{icons.warning}Aucun hook commit-msg trouvé</Text>
      </Box>
    );
  }

  if (uninstalling) {
    return <Text>Désinstallation du hook...</Text>;
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Désinstallation du hook Git
        </Text>
      </Box>

      {!isGortexHook && (
        <Box marginBottom={1}>
          <Text color="yellow">
            {icons.warning}Le hook commit-msg n'a pas été créé par gortex
          </Text>
        </Box>
      )}

      <Confirm
        message="Voulez-vous quand même le supprimer ?"
        defaultValue={isGortexHook}
        onSubmit={handleConfirm}
      />
    </Box>
  );
};
