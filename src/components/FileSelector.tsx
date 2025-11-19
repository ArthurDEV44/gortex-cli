import React, { useState, useEffect } from 'react';
import { Box } from 'ink';
import { Select, MultiSelect, type SelectItem, type MultiSelectItem } from '../ui/index.js';
import { FileDiffPreview } from './FileDiffPreview.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import { useRepositoryStatus } from '../infrastructure/di/hooks.js';
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
  const repositoryStatusUseCase = useRepositoryStatus();

  const [step, setStep] = useState<'choice' | 'select'>('choice');
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const result = await repositoryStatusUseCase.execute();

        if (result.success && result.files) {
          // Convert FileStatusDTO to FileWithStatus format
          const filesWithStatus = result.files.map(f => ({
            path: f.path,
            status: getStatusLabel(f.status),
          }));
          setFiles(filesWithStatus);
        } else {
          setError(result.error || 'Failed to load file status');
        }
      } catch (err: any) {
        setError(err.message || 'Unexpected error loading files');
      } finally {
        setLoading(false);
      }
    };
    loadFiles();
  }, []);

  const getStatusLabel = (status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked'): string => {
    switch (status) {
      case 'added':
      case 'untracked':
        return 'nouveau';
      case 'deleted':
        return 'supprimé';
      case 'modified':
        return 'modifié';
      case 'renamed':
        return 'renommé';
      default:
        return status;
    }
  };

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

  if (loading) {
    return <LoadingSpinner message="Analyzing changes..." />;
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Box paddingX={2} paddingY={1} borderStyle="round" borderColor="red">
          <Box>
            <Box marginRight={1}>{icons.error}</Box>
            <Box>Error: {error}</Box>
          </Box>
        </Box>
      </Box>
    );
  }

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
              label: `${icons.filter} Select files`,
              value: 'select',
              description: 'Choose specific files to stage',
            },
          ]}
          onSelect={handleChoice}
        />
      )}

      {step === 'select' && (
        <MultiSelect
          message="Select files to include in commit"
          items={files.map(f => ({
            label: `${chalk[getStatusColor(f.status)](f.status)} ${f.path}`,
            value: f.path,
            checked: true,
          }))}
          onSubmit={handleFileSelect}
        />
      )}
    </Box>
  );
};
