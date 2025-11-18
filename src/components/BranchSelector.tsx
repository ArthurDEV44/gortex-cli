import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { Select, Confirm, TextInput, type SelectItem } from '../ui/index.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import { icons, commitIcons } from '../theme/colors.js';
import {
  getCurrentBranch,
  getAllBranches,
  checkoutBranch,
  createAndCheckoutBranch,
  branchExists,
} from '../utils/git.js';

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
    return <LoadingSpinner message="Loading branches..." />;
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
      return 'Branch name cannot be empty';
    }
    if (trimmed.includes(' ')) {
      return 'Branch name cannot contain spaces';
    }
    if (await branchExists(trimmed)) {
      return `Branch "${trimmed}" already exists`;
    }
    return true;
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text dimColor>Current: </Text>
        <Gradient name="passion">
          <Text bold>{currentBranch}</Text>
        </Gradient>
      </Box>

      {step === 'select' && (
        <Select
          message="Select or create a branch"
          items={[
            ...branches.map(b => ({
              label: b === currentBranch ? `${b} ✓` : b,
              value: b,
              description: b === currentBranch ? 'Current branch' : undefined,
            })),
            {
              label: `${commitIcons.feat} Create new branch`,
              value: '__CREATE_NEW__',
              description: 'Create and switch to a new branch',
            },
          ]}
          initialIndex={branches.indexOf(currentBranch)}
          onSelect={handleBranchSelect}
        />
      )}

      {step === 'create' && (
        <TextInput
          message="New branch name:"
          placeholder="feature/my-awesome-feature"
          validate={validateBranchName}
          onSubmit={handleCreateBranch}
        />
      )}

      {step === 'confirm' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="green">✓ Selected: </Text>
            <Gradient name="summer">
              <Text bold>{selectedBranch}</Text>
            </Gradient>
          </Box>
          <Confirm
            message="Continue with this branch?"
            defaultValue={true}
            onSubmit={handleConfirm}
          />
        </Box>
      )}
    </Box>
  );
};
