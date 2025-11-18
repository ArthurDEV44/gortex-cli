import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Select, Confirm, TextInput, type SelectItem } from '../ui/index.js';
import {
  getCurrentBranch,
  getAllBranches,
  checkoutBranch,
  createAndCheckoutBranch,
  branchExists,
} from '../utils/git.js';
import chalk from 'chalk';

interface BranchSelectorProps {
  onComplete: (branch: string) => void;
}

type Step = 'select' | 'create' | 'confirm';

export const BranchSelector: React.FC<BranchSelectorProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('select');
  const [currentBranch, setCurrentBranch] = useState<string>('');
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranches = async () => {
      const current = await getCurrentBranch();
      const all = await getAllBranches();
      setCurrentBranch(current);
      setBranches(all);
      setSelectedBranch(current);
      setLoading(false);
    };
    loadBranches();
  }, []);

  if (loading) {
    return <Text>Chargement des branches...</Text>;
  }

  const handleBranchSelect = async (item: SelectItem) => {
    if (item.value === '__CREATE_NEW__') {
      setStep('create');
    } else {
      setSelectedBranch(item.value);
      if (item.value !== currentBranch) {
        await checkoutBranch(item.value);
      }
      setStep('confirm');
    }
  };

  const handleCreateBranch = async (branchName: string) => {
    await createAndCheckoutBranch(branchName);
    setSelectedBranch(branchName);
    setCurrentBranch(branchName);
    setStep('confirm');
  };

  const handleConfirm = (confirmed: boolean) => {
    if (confirmed) {
      onComplete(selectedBranch);
    } else {
      setStep('select');
    }
  };

  const validateBranchName = async (input: string): Promise<string | true> => {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return 'Le nom de la branche ne peut pas être vide';
    }
    if (trimmed.includes(' ')) {
      return "Le nom de la branche ne peut pas contenir d'espaces";
    }
    if (await branchExists(trimmed)) {
      return `La branche "${trimmed}" existe déjà`;
    }
    return true;
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="blue">📍 Étape 1/5: Sélection de la branche</Text>
      </Box>
      <Box marginBottom={1}>
        <Text dimColor>Branche actuelle: </Text>
        <Text color="cyan">{currentBranch}</Text>
      </Box>

      {step === 'select' && (
        <Select
          message="Que voulez-vous faire ?"
          items={[
            ...branches.map(b => ({
              label: b === currentBranch ? `${b} ${chalk.green('(actuelle)')}` : b,
              value: b,
            })),
            { label: chalk.green('➕ Créer une nouvelle branche'), value: '__CREATE_NEW__' },
          ]}
          initialIndex={branches.indexOf(currentBranch)}
          onSelect={handleBranchSelect}
        />
      )}

      {step === 'create' && (
        <TextInput
          message="Nom de la nouvelle branche:"
          validate={validateBranchName}
          onSubmit={handleCreateBranch}
        />
      )}

      {step === 'confirm' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="green">✓ Branche: {selectedBranch}</Text>
          </Box>
          <Confirm
            message="Continuer avec cette branche ?"
            defaultValue={true}
            onSubmit={handleConfirm}
          />
        </Box>
      )}
    </Box>
  );
};
