import React, { useState, useEffect } from 'react';
import { Box } from 'ink';
import { Select, MultiSelect, type SelectItem, type MultiSelectItem } from '../ui/index.js';
import { FileDiffPreview } from './FileDiffPreview.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import { getModifiedFilesWithStatus } from '../utils/git.js';
import chalk from 'chalk';
import { icons } from '../theme/colors.js';

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
    return <LoadingSpinner message="Analyzing changes..." />;
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
      <FileDiffPreview files={files} />

      {step === 'choice' && (
        <Select
          message="Which files do you want to include?"
          items={[
            {
              label: `${icons.fileChanged} All files`,
              value: 'all',
              description: `Stage all ${files.length} changed file${files.length > 1 ? 's' : ''}`,
            },
            {
              label: '🎯 Select files',
              value: 'select',
              description: 'Choose specific files to stage',
            },
          ]}
          onSelect={handleChoice}
        />
      )}

      {step === 'select' && (
        <MultiSelect
          message="Select files to stage:"
          items={files.map(file => ({
            label: `${chalk[getStatusColor(file.status)](`[${file.status}]`)} ${file.path}`,
            value: file.path,
            description: `${file.status} file`,
          }))}
          onSubmit={handleFileSelect}
          minSelection={1}
        />
      )}
    </Box>
  );
};
