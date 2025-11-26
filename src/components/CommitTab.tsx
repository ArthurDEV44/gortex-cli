import { Box, Text, useApp } from "ink";
import Spinner from "ink-spinner";
import { useEffect, useState } from "react";
import { useStageFiles } from "../infrastructure/di/hooks.js";
import { colors, commitIcons, createGradient, icons } from "../theme/colors.js";
import type { AIProvider, CommitConfig } from "../types.js";
import { AgenticAICommitGenerator } from "./AgenticAICommitGenerator.js";
import { BranchSelector } from "./BranchSelector.js";
import { CommitConfirmation } from "./CommitConfirmation.js";
import { CommitMessageBuilder } from "./CommitMessageBuilder.js";
import { type CommitMode, CommitModeSelector } from "./CommitModeSelector.js";
import { CommitWelcome } from "./CommitWelcome.js";
import { ContinuePrompt } from "./ContinuePrompt.js";
import { FileSelector } from "./FileSelector.js";
import { PushPrompt } from "./PushPrompt.js";
import { StepIndicator } from "./StepIndicator.js";
import { SuccessMessage } from "./SuccessMessage.js";

type Step =
  | "idle"
  | "branch"
  | "files"
  | "staging"
  | "mode"
  | "ai-generate"
  | "manual-message"
  | "confirm"
  | "push"
  | "success"
  | "continue";

const STEP_NAMES: Record<Step, { number: number; name: string; icon: string }> =
  {
    idle: { number: 0, name: "Ready", icon: icons.circle },
    branch: { number: 1, name: "Branch Selection", icon: icons.branch },
    files: { number: 2, name: "File Selection", icon: icons.fileChanged },
    staging: { number: 3, name: "Staging Files", icon: icons.fileAdded },
    mode: { number: 4, name: "Generation Mode", icon: icons.settings },
    "ai-generate": { number: 5, name: "AI Generation", icon: commitIcons.feat },
    "manual-message": { number: 5, name: "Commit Message", icon: icons.step },
    confirm: { number: 6, name: "Confirmation", icon: icons.success },
    push: { number: 7, name: "Push to Remote", icon: icons.push },
    success: { number: 8, name: "Complete", icon: icons.completed },
    continue: { number: 9, name: "Continue", icon: icons.arrowRight },
  };

interface Props {
  config: CommitConfig;
  onWorkflowStateChange?: (isInWorkflow: boolean) => void;
}

export const CommitTab = ({ config, onWorkflowStateChange }: Props) => {
  const { exit } = useApp();
  const stageFilesUseCase = useStageFiles();

  const [step, setStep] = useState<Step>("idle");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [commitMode, setCommitMode] = useState<CommitMode>("manual");
  const [aiProvider, setAIProvider] = useState<AIProvider | undefined>();
  const [commitMessage, setCommitMessage] = useState<string>("");

  const handleStartWorkflow = () => {
    setStep("branch");
  };

  const handleBranchComplete = (branch: string) => {
    setSelectedBranch(branch);
    setStep("files");
  };

  const handleFilesComplete = async (files: string[]) => {
    setSelectedFiles(files);
    setStep("staging");

    // Stage the files using clean architecture use case
    try {
      const result = await stageFilesUseCase.execute({ files });

      if (result.success) {
        setStep("mode");
      } else {
        // Handle error - could add error state here
        console.error("Error staging files:", result.error);
        setStep("mode"); // Continue anyway
      }
    } catch (error) {
      console.error("Unexpected error staging files:", error);
      setStep("mode"); // Continue anyway
    }
  };

  const handleModeComplete = (mode: CommitMode, provider?: AIProvider) => {
    setCommitMode(mode);
    setAIProvider(provider);

    if (mode === "ai" && provider) {
      setStep("ai-generate");
    } else {
      setStep("manual-message");
    }
  };

  const handleAIComplete = (
    message: string | null,
    fallbackToManual: boolean,
  ) => {
    if (fallbackToManual || !message) {
      // User rejected AI suggestion or error occurred
      setStep("manual-message");
    } else {
      // User accepted AI suggestion
      setCommitMessage(message);
      setStep("confirm");
    }
  };

  const handleManualComplete = (message: string) => {
    setCommitMessage(message);
    setStep("confirm");
  };

  const handleConfirmComplete = (success: boolean) => {
    if (success) {
      setStep("push");
    } else {
      // User cancelled, go back to message
      if (commitMode === "ai") {
        setStep("ai-generate");
      } else {
        setStep("manual-message");
      }
    }
  };

  const handlePushComplete = () => {
    setStep("success");
    // Automatically move to continue prompt after a short delay
    setTimeout(() => {
      setStep("continue");
    }, 2000);
  };

  const handleContinueComplete = (shouldContinue: boolean) => {
    if (shouldContinue) {
      // Reset all state and go back to idle
      setSelectedBranch("");
      setSelectedFiles([]);
      setCommitMode("manual");
      setAIProvider(undefined);
      setCommitMessage("");
      setStep("idle");
    } else {
      // Exit the application
      exit();
    }
  };

  // Notify parent when workflow state changes
  useEffect(() => {
    // Tab navigation should be enabled only in 'idle' and 'continue' states
    const isInWorkflow = step !== "idle" && step !== "continue";
    onWorkflowStateChange?.(isInWorkflow);
  }, [step, onWorkflowStateChange]);

  // Determine current step info
  const currentStepInfo = STEP_NAMES[step];
  const totalSteps = 8;

  return (
    <Box flexDirection="column">
      {/* Step Indicator */}
      {step !== "idle" && step !== "success" && step !== "continue" && (
        <StepIndicator
          currentStep={currentStepInfo.number}
          totalSteps={totalSteps}
          stepName={currentStepInfo.name}
          icon={currentStepInfo.icon}
        />
      )}

      <Box marginTop={1}>
        {/* Step 0: Idle/Welcome */}
        {step === "idle" && <CommitWelcome onStart={handleStartWorkflow} />}

        {/* Step 1: Branch Selection */}
        {step === "branch" && (
          <BranchSelector onComplete={handleBranchComplete} />
        )}

        {/* Step 2: File Selection */}
        {step === "files" && <FileSelector onComplete={handleFilesComplete} />}

        {/* Step 3: Staging Files */}
        {step === "staging" && (
          <Box
            borderStyle="round"
            borderColor={colors.border}
            paddingX={2}
            paddingY={1}
          >
            <Text>
              <Spinner type="dots" />{" "}
              {createGradient.commitMessage(
                `Staging ${selectedFiles.length} file(s)...`,
              )}
            </Text>
          </Box>
        )}

        {/* Step 4: Mode Selection */}
        {step === "mode" && (
          <CommitModeSelector config={config} onComplete={handleModeComplete} />
        )}

        {/* Step 5a: AI Generation (Agentic with Reflection Pattern) */}
        {step === "ai-generate" && aiProvider && (
          <AgenticAICommitGenerator
            provider={aiProvider}
            config={config}
            onComplete={handleAIComplete}
          />
        )}

        {/* Step 5b: Manual Message */}
        {step === "manual-message" && (
          <CommitMessageBuilder onComplete={handleManualComplete} />
        )}

        {/* Step 6: Confirmation */}
        {step === "confirm" && (
          <CommitConfirmation
            message={commitMessage}
            files={selectedFiles}
            onComplete={handleConfirmComplete}
          />
        )}

        {/* Step 7: Push */}
        {step === "push" && (
          <PushPrompt branch={selectedBranch} onComplete={handlePushComplete} />
        )}

        {/* Step 8: Success */}
        {step === "success" && (
          <SuccessMessage
            title="Commit Created!"
            subtitle={`Your changes have been committed successfully${commitMode === "ai" ? " with AI" : ""}`}
            details={[
              `Branch: ${selectedBranch}`,
              `Files: ${selectedFiles.length} changed`,
              `Message: ${commitMessage.split("\n")[0]}`,
              commitMode === "ai"
                ? `Generated by: ${aiProvider || "AI"}`
                : "Created manually",
            ]}
            icon={icons.success}
          />
        )}

        {/* Step 9: Continue Prompt */}
        {step === "continue" && (
          <ContinuePrompt onComplete={handleContinueComplete} />
        )}
      </Box>
    </Box>
  );
};
