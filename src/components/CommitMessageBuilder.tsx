import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { icons } from "../theme/colors.js";
import type { CommitAnswers, CommitConfig } from "../types.js";
import { Select, type SelectItem, TextInput } from "../ui/index.js";
import { loadConfig } from "../utils/config.js";
import { formatCommitMessage } from "../utils/validate.js";

interface CommitMessageBuilderProps {
  onComplete: (message: string) => void;
}

type Step = "type" | "scope" | "customScope" | "subject" | "body" | "done";

export const CommitMessageBuilder = ({
  onComplete,
}: CommitMessageBuilderProps) => {
  const [step, setStep] = useState<Step>("type");
  const [config, setConfig] = useState<CommitConfig | null>(null);
  const [answers, setAnswers] = useState<Partial<CommitAnswers>>({});

  useEffect(() => {
    const load = async () => {
      const cfg = await loadConfig();
      setConfig(cfg);
    };
    load();
  }, []);

  if (!config) {
    return <Text>Chargement de la configuration...</Text>;
  }

  const handleTypeSelect = (item: SelectItem) => {
    setAnswers((prev) => ({ ...prev, type: item.value }));
    if (config.scopes && config.scopes.length > 0) {
      setStep("scope");
    } else if (config.allowCustomScopes) {
      setStep("customScope");
    } else {
      setStep("subject");
    }
  };

  const handleScopeSelect = (item: SelectItem) => {
    if (item.value === "__CUSTOM__") {
      setStep("customScope");
    } else if (item.value === "__NONE__") {
      setAnswers((prev) => ({ ...prev, scope: "" }));
      setStep("subject");
    } else {
      setAnswers((prev) => ({ ...prev, scope: item.value }));
      setStep("subject");
    }
  };

  const handleCustomScope = (scope: string) => {
    setAnswers((prev) => ({ ...prev, scope: scope.trim() }));
    setStep("subject");
  };

  const handleSubject = (subject: string) => {
    setAnswers((prev) => ({ ...prev, subject: subject.trim() }));
    setStep("body");
  };

  const handleBody = (body: string) => {
    if (!answers.type || !answers.subject) {
      // This should never happen if the workflow is followed correctly
      return;
    }

    const finalAnswers: CommitAnswers = {
      type: answers.type,
      scope: answers.scope || "",
      subject: answers.subject,
      body: body.trim() || undefined,
    };

    const message = formatCommitMessage(
      finalAnswers.type,
      finalAnswers.scope || undefined,
      finalAnswers.subject,
      finalAnswers.body,
    );

    onComplete(message);
  };

  const validateSubject = (input: string): string | true => {
    const length = input.trim().length;
    const min = config.minSubjectLength || 3;
    const max = config.maxSubjectLength || 100;

    if (length < min) {
      return `La description doit contenir au moins ${min} caractères`;
    }
    if (length > max) {
      return `La description ne doit pas dépasser ${max} caractères`;
    }
    return true;
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="blue">
          {icons.step} Étape 3/5: Message de commit
        </Text>
      </Box>

      {step === "type" && (
        <Select
          message="Type de commit:"
          items={
            config.types?.map((t) => ({
              label: t.name,
              value: t.value,
            })) || []
          }
          onSelect={handleTypeSelect}
        />
      )}

      {step === "scope" && (
        <Select
          message="Scope (optionnel):"
          items={[
            ...(config.scopes?.map((s) => ({ label: s, value: s })) || []),
            { label: "(aucun)", value: "__NONE__" },
            ...(config.allowCustomScopes
              ? [{ label: "(personnalisé)", value: "__CUSTOM__" }]
              : []),
          ]}
          onSelect={handleScopeSelect}
        />
      )}

      {step === "customScope" && (
        <TextInput
          message="Scope personnalisé (optionnel, Entrée pour passer):"
          onSubmit={handleCustomScope}
        />
      )}

      {step === "subject" && (
        <TextInput
          message={`Description courte (${config.minSubjectLength}-${config.maxSubjectLength} caractères):`}
          validate={validateSubject}
          onSubmit={handleSubject}
        />
      )}

      {step === "body" && (
        <TextInput
          message="Description longue (optionnel, Entrée pour passer):"
          onSubmit={handleBody}
        />
      )}
    </Box>
  );
};
