import { Box } from "ink";
import { useState } from "react";
import { icons } from "../theme/colors.js";
import { BranchSelector } from "./BranchSelector.js";
import { Brand } from "./Brand.js";
import { CommitConfirmation } from "./CommitConfirmation.js";
import { CommitMessageBuilder } from "./CommitMessageBuilder.js";
import { ErrorMessage } from "./ErrorMessage.js";
import { FileSelector } from "./FileSelector.js";
import { PushPrompt } from "./PushPrompt.js";
import { StepIndicator } from "./StepIndicator.js";
import { SuccessMessage } from "./SuccessMessage.js";

type WorkflowStep =
  | "branch"
  | "files"
  | "message"
  | "confirm"
  | "push"
  | "success"
  | "cancelled";

const STEP_CONFIG = {
  branch: { number: 1, name: "Branch Selection", icon: icons.branch },
  files: { number: 2, name: "File Selection", icon: icons.fileChanged },
  message: { number: 3, name: "Commit Message", icon: icons.step },
  confirm: { number: 4, name: "Confirmation", icon: icons.success },
  push: { number: 5, name: "Push to Remote", icon: icons.push },
};

export const CommitWorkflow = () => {
  const [step, setStep] = useState<WorkflowStep>("branch");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [commitMessage, setCommitMessage] = useState<string>("");

  const handleBranchComplete = (branch: string) => {
    setSelectedBranch(branch);
    setStep("files");
  };

  const handleFilesComplete = (files: string[]) => {
    setSelectedFiles(files);
    setStep("message");
  };

  const handleMessageComplete = (message: string) => {
    setCommitMessage(message);
    setStep("confirm");
  };

  const handleConfirmComplete = (success: boolean) => {
    if (success) {
      setStep("push");
    } else {
      setStep("cancelled");
    }
  };

  const handlePushComplete = () => {
    setStep("success");
  };

  const currentStepConfig = STEP_CONFIG[step as keyof typeof STEP_CONFIG];
  const totalSteps = Object.keys(STEP_CONFIG).length;

  return (
    <Box flexDirection="column" paddingY={1}>
      <Brand variant="small" />

      {currentStepConfig && (
        <StepIndicator
          currentStep={currentStepConfig.number}
          totalSteps={totalSteps}
          stepName={currentStepConfig.name}
          icon={currentStepConfig.icon}
        />
      )}

      <Box marginTop={1}>
        {step === "branch" && (
          <BranchSelector onComplete={handleBranchComplete} />
        )}
        {step === "files" && <FileSelector onComplete={handleFilesComplete} />}
        {step === "message" && (
          <CommitMessageBuilder onComplete={handleMessageComplete} />
        )}
        {step === "confirm" && (
          <CommitConfirmation
            message={commitMessage}
            files={selectedFiles}
            onComplete={handleConfirmComplete}
          />
        )}
        {step === "push" && (
          <PushPrompt branch={selectedBranch} onComplete={handlePushComplete} />
        )}
        {step === "success" && (
          <SuccessMessage
            title="Workflow Complete!"
            subtitle="Your commit has been created successfully"
            details={[
              `Branch: ${selectedBranch}`,
              `Files: ${selectedFiles.length} changed`,
              `Message: ${commitMessage.split("\n")[0]}`,
            ]}
            icon={icons.success}
          />
        )}
        {step === "cancelled" && (
          <ErrorMessage
            title="Workflow Cancelled"
            message="The commit was not created"
            suggestions={[
              "Run gortex again to restart",
              "Use git commit manually for more control",
            ]}
          />
        )}
      </Box>
    </Box>
  );
};
