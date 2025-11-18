import React from 'react';
import { Box, Text } from 'ink';
import { Confirm } from '../ui/index.js';
import { stageFiles, createCommit } from '../utils/git.js';
import chalk from 'chalk';

interface CommitConfirmationProps {
  message: string;
  files: string[];
  onComplete: (success: boolean) => void;
}

export const CommitConfirmation: React.FC<CommitConfirmationProps> = ({
  message,
  files,
  onComplete,
}) => {
  const handleConfirm = async (confirmed: boolean) => {
    if (!confirmed) {
      onComplete(false);
      return;
    }

    try {
      await stageFiles(files);
      await createCommit(message);
      onComplete(true);
    } catch (error) {
      console.error(chalk.red('❌ Erreur lors de la création du commit:'), error);
      onComplete(false);
    }
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="blue">📋 Étape 4/5: Confirmation</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text dimColor>Fichiers à commiter:</Text>
        {files.slice(0, 5).map((file, i) => (
          <Text key={i} dimColor>  - {file}</Text>
        ))}
        {files.length > 5 && <Text dimColor>  ... et {files.length - 5} autre(s)</Text>}
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text dimColor>Message de commit:</Text>
        <Text color="cyan">  {message.split('\n')[0]}</Text>
      </Box>

      <Confirm message="Créer ce commit ?" defaultValue={true} onSubmit={handleConfirm} />
    </Box>
  );
};
