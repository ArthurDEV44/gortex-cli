import React, { useState } from 'react';
import { Box } from 'ink';
import { BranchSelector } from './BranchSelector.js';
import { FileSelector } from './FileSelector.js';
import { CommitModeSelector, type CommitMode } from './CommitModeSelector.js';
import { AICommitGenerator } from './AICommitGenerator.js';
import { CommitMessageBuilder } from './CommitMessageBuilder.js';
import { CommitConfirmation } from './CommitConfirmation.js';
import { PushPrompt } from './PushPrompt.js';
import { SuccessMessage } from './SuccessMessage.js';
import { StepIndicator } from './StepIndicator.js';
import type { AIProvider, CommitConfig } from '../types.js';

type Step =
  | 'branch'
  | 'files'
  | 'mode'
  | 'ai-generate'
  | 'manual-message'
  | 'confirm'
  | 'push'
  | 'success';

const STEP_NAMES: Record<Step, { number: number; name: string; icon: string }> = {
  branch: { number: 1, name: 'Branch Selection', icon: '🌿' },
  files: { number: 2, name: 'File Selection', icon: '📦' },
  mode: { number: 3, name: 'Generation Mode', icon: '🤖' },
  'ai-generate': { number: 4, name: 'AI Generation', icon: '✨' },
  'manual-message': { number: 4, name: 'Commit Message', icon: '💬' },
  confirm: { number: 5, name: 'Confirmation', icon: '✓' },
  push: { number: 6, name: 'Push to Remote', icon: '🚀' },
  success: { number: 7, name: 'Complete', icon: '🎉' },
};

interface Props {
  config: CommitConfig;
}

export const CommitTab: React.FC<Props> = ({ config }) => {
  const [step, setStep] = useState<Step>('branch');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [commitMode, setCommitMode] = useState<CommitMode>('manual');
  const [aiProvider, setAIProvider] = useState<AIProvider | undefined>();
  const [commitMessage, setCommitMessage] = useState<string>('');

  const handleBranchComplete = (branch: string) => {
    setSelectedBranch(branch);
    setStep('files');
  };

  const handleFilesComplete = (files: string[]) => {
    setSelectedFiles(files);
    setStep('mode');
  };

  const handleModeComplete = (mode: CommitMode, provider?: AIProvider) => {
    setCommitMode(mode);
    setAIProvider(provider);

    if (mode === 'ai' && provider) {
      setStep('ai-generate');
    } else {
      setStep('manual-message');
    }
  };

  const handleAIComplete = (message: string | null, fallbackToManual: boolean) => {
    if (fallbackToManual || !message) {
      // User rejected AI suggestion or error occurred
      setStep('manual-message');
    } else {
      // User accepted AI suggestion
      setCommitMessage(message);
      setStep('confirm');
    }
  };

  const handleManualComplete = (message: string) => {
    setCommitMessage(message);
    setStep('confirm');
  };

  const handleConfirmComplete = (success: boolean) => {
    if (success) {
      setStep('push');
    } else {
      // User cancelled, go back to message
      if (commitMode === 'ai') {
        setStep('ai-generate');
      } else {
        setStep('manual-message');
      }
    }
  };

  const handlePushComplete = () => {
    setStep('success');
  };

  // Determine current step info
  const currentStepInfo = STEP_NAMES[step];
  const totalSteps = 7;

  return (
    <Box flexDirection="column">
      {/* Step Indicator */}
      {step !== 'success' && (
        <StepIndicator
          currentStep={currentStepInfo.number}
          totalSteps={totalSteps}
          stepName={currentStepInfo.name}
          icon={currentStepInfo.icon}
        />
      )}

      <Box marginTop={1}>
        {/* Step 1: Branch Selection */}
        {step === 'branch' && (
          <BranchSelector onComplete={handleBranchComplete} />
        )}

        {/* Step 2: File Selection */}
        {step === 'files' && (
          <FileSelector onComplete={handleFilesComplete} />
        )}

        {/* Step 3: Mode Selection */}
        {step === 'mode' && (
          <CommitModeSelector
            config={config}
            onComplete={handleModeComplete}
          />
        )}

        {/* Step 4a: AI Generation */}
        {step === 'ai-generate' && aiProvider && (
          <AICommitGenerator
            provider={aiProvider}
            config={config}
            onComplete={handleAIComplete}
          />
        )}

        {/* Step 4b: Manual Message */}
        {step === 'manual-message' && (
          <CommitMessageBuilder onComplete={handleManualComplete} />
        )}

        {/* Step 5: Confirmation */}
        {step === 'confirm' && (
          <CommitConfirmation
            message={commitMessage}
            files={selectedFiles}
            onComplete={handleConfirmComplete}
          />
        )}

        {/* Step 6: Push */}
        {step === 'push' && (
          <PushPrompt
            branch={selectedBranch}
            onComplete={handlePushComplete}
          />
        )}

        {/* Step 7: Success */}
        {step === 'success' && (
          <SuccessMessage
            title="Commit Created!"
            subtitle={`Your changes have been committed successfully${commitMode === 'ai' ? ' with AI' : ''}`}
            details={[
              `Branch: ${selectedBranch}`,
              `Files: ${selectedFiles.length} changed`,
              `Message: ${commitMessage.split('\n')[0]}`,
              commitMode === 'ai' ? `Generated by: ${aiProvider || 'AI'}` : 'Created manually',
            ]}
            icon="✓"
          />
        )}
      </Box>
    </Box>
  );
};
