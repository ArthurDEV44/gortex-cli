import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Select, MultiSelect, type SelectItem, type MultiSelectItem } from '../ui/index.js';
import { getModifiedFilesWithStatus } from '../utils/git.js';
import chalk from 'chalk';

interface FileSelectorProps {
  onComplete: (files: string[]) => void;
}

type FileWithStatus = {
  path: string;
  status: string;
};

export const FileSelector: React.FC<FileSelectorProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'choice' | 'select'>('choice');
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      const modifiedFiles = await getModifiedFilesWithStatus();
      setFiles(modifiedFiles);
      setLoading(false);
    };
    loadFiles();
  }, []);

  if (loading) {
    return <Text>Chargement des fichiers...</Text>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nouveau':
        return 'green';
      case 'supprimé':
        return 'red';
      default:
        return 'yellow';
    }
  };

  const handleChoice = (item: SelectItem) => {
    if (item.value === 'all') {
      onComplete(files.map(f => f.path));
    } else {
      setStep('select');
    }
  };

  const handleFileSelect = (selected: string[]) => {
    onComplete(selected);
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="blue">📝 Étape 2/5: Sélection des fichiers</Text>
      </Box>
      <Box marginBottom={1}>
        <Text dimColor>{files.length} fichier(s) modifié(s)</Text>
      </Box>

      {/* Display file list */}
      <Box flexDirection="column" marginBottom={1}>
        {files.slice(0, 10).map((file, i) => (
          <Box key={i}>
            <Text color={getStatusColor(file.status)}>[{file.status}]</Text>
            <Text> {file.path}</Text>
          </Box>
        ))}
        {files.length > 10 && <Text dimColor>... et {files.length - 10} autre(s)</Text>}
      </Box>

      {step === 'choice' && (
        <Select
          message="Quels fichiers voulez-vous inclure dans le commit ?"
          items={[
            { label: '📦 Tous les fichiers', value: 'all' },
            { label: '🎯 Sélectionner les fichiers', value: 'select' },
          ]}
          onSelect={handleChoice}
        />
      )}

      {step === 'select' && (
        <MultiSelect
          message="Sélectionnez les fichiers à inclure:"
          items={files.map(file => ({
            label: `${chalk[getStatusColor(file.status)](`[${file.status}]`)} ${file.path}`,
            value: file.path,
          }))}
          onSubmit={handleFileSelect}
          minSelection={1}
        />
      )}
    </Box>
  );
};
