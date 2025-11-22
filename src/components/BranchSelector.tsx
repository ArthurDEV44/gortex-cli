import { Box, Text } from "ink";
import Gradient from "ink-gradient";
import { useEffect, useState } from "react";
import { useBranchOperations } from "../infrastructure/di/hooks.js";
import { commitIcons, icons } from "../theme/colors.js";
import { Confirm, Select, type SelectItem, TextInput } from "../ui/index.js";
import { LoadingSpinner } from "./LoadingSpinner.js";

interface BranchSelectorProps {
  onComplete: (branch: string) => void;
}

type Step = "select" | "create" | "confirm";

export const BranchSelector = ({ onComplete }: BranchSelectorProps) => {
  const branchOperationsUseCase = useBranchOperations();

  const [step, setStep] = useState<Step>("select");
  const [currentBranch, setCurrentBranch] = useState<string>("");
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        // Use clean architecture use case to get all branches
        const result = await branchOperationsUseCase.getAllBranches();

        if (!result.success || !result.branches || !result.currentBranch) {
          setError(result.error || "Failed to load branches");
          setLoading(false);
          return;
        }

        setCurrentBranch(result.currentBranch);
        setBranches(result.branches);
        setSelectedBranch(result.currentBranch);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };
    loadBranches();
  }, [branchOperationsUseCase]);

  if (loading) {
    return <LoadingSpinner message="Loading branches..." />;
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Box paddingX={2} paddingY={1} borderStyle="round" borderColor="red">
          <Box>
            <Box marginRight={1}>
              <Text>{icons.error}</Text>
            </Box>
            <Box>
              <Text>Error: {error}</Text>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  const handleBranchSelect = async (item: SelectItem) => {
    if (item.value === "__CREATE_NEW__") {
      setStep("create");
    } else {
      setSelectedBranch(item.value);
      if (item.value !== currentBranch) {
        // Use clean architecture use case to checkout branch
        const result = await branchOperationsUseCase.checkoutBranch({
          branchName: item.value,
        });
        if (!result.success) {
          setError(result.error || "Failed to checkout branch");
          return;
        }
      }
      setStep("confirm");
    }
  };

  const handleCreateBranch = async (branchName: string) => {
    // Use clean architecture use case to create and checkout branch
    const result = await branchOperationsUseCase.createBranch({
      branchName,
      checkout: true,
    });

    if (!result.success) {
      setError(result.error || "Failed to create branch");
      return;
    }

    setSelectedBranch(branchName);
    setCurrentBranch(branchName);
    setStep("confirm");
  };

  const handleConfirm = (confirmed: boolean) => {
    if (confirmed) {
      onComplete(selectedBranch);
    } else {
      setStep("select");
    }
  };

  const validateBranchName = async (input: string): Promise<string | true> => {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return "Branch name cannot be empty";
    }
    if (trimmed.includes(" ")) {
      return "Branch name cannot contain spaces";
    }

    // Use clean architecture use case to check if branch exists
    const result = await branchOperationsUseCase.branchExists({
      branchName: trimmed,
    });
    if (result.success && result.exists) {
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

      {step === "select" && (
        <Select
          message="Select or create a branch"
          items={[
            ...branches.map((b) => ({
              label: b === currentBranch ? `${b} ${icons.success}` : b,
              value: b,
              description: b === currentBranch ? "Current branch" : undefined,
            })),
            {
              label: `${commitIcons.feat} Create new branch`,
              value: "__CREATE_NEW__",
              description: "Create and switch to a new branch",
            },
          ]}
          initialIndex={branches.indexOf(currentBranch)}
          onSelect={handleBranchSelect}
        />
      )}

      {step === "create" && (
        <TextInput
          message="New branch name:"
          placeholder="feature/my-awesome-feature"
          validate={validateBranchName}
          onSubmit={handleCreateBranch}
        />
      )}

      {step === "confirm" && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="green">{icons.success} Selected: </Text>
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
