import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { BranchSelector } from './BranchSelector.js';
import { FileSelector } from './FileSelector.js';
import { CommitMessageBuilder } from './CommitMessageBuilder.js';
import { CommitConfirmation } from './CommitConfirmation.js';
import { PushPrompt } from './PushPrompt.js';

type WorkflowStep = 'branch' | 'files' | 'message' | 'confirm' | 'push' | 'success' | 'cancelled';

export const CommitWorkflow: React.FC = () => {
  const [step, setStep] = useState<WorkflowStep>('branch');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [commitMessage, setCommitMessage] = useState<string>('');

  const handleBranchComplete = (branch: string) => {
    setSelectedBranch(branch);
    setStep('files');
  };

  const handleFilesComplete = (files: string[]) => {
    setSelectedFiles(files);
    setStep('message');
  };

  const handleMessageComplete = (message: string) => {
    setCommitMessage(message);
    setStep('confirm');
  };

  const handleConfirmComplete = (success: boolean) => {
    if (success) {
      setStep('push');
    } else {
      setStep('cancelled');
    }
  };

  const handlePushComplete = () => {
    setStep('success');
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">🚀 Gortex CLI - Workflow Git complet</Text>
      </Box>

      {step === 'branch' && <BranchSelector onComplete={handleBranchComplete} />}
      {step === 'files' && <FileSelector onComplete={handleFilesComplete} />}
      {step === 'message' && <CommitMessageBuilder onComplete={handleMessageComplete} />}
      {step === 'confirm' && (
        <CommitConfirmation
          message={commitMessage}
          files={selectedFiles}
          onComplete={handleConfirmComplete}
        />
      )}
      {step === 'push' && <PushPrompt branch={selectedBranch} onComplete={handlePushComplete} />}
      {step === 'success' && (
        <Box flexDirection="column">
          <Text color="green">✅ Workflow terminé avec succès !</Text>
        </Box>
      )}
      {step === 'cancelled' && (
        <Box flexDirection="column">
          <Text color="yellow">❌ Commit annulé</Text>
        </Box>
      )}
    </Box>
  );
};
