/**
 * Agentic AI Commit Generator Component
 *
 * This component implements commit message generation using the Reflection Pattern:
 * - Generate: Initial commit message
 * - Reflect: AI self-evaluates quality
 * - Refine: Improve based on reflection feedback
 * - Repeat: Up to 2 iterations for optimal quality
 *
 * Displays real-time progress, iterations, and performance metrics
 */

import { Box, Text } from "ink";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AgenticGenerationResult } from "../application/use-cases/AgenticCommitGenerationUseCase.js";
import { useAgenticCommitGeneration } from "../infrastructure/di/hooks.js";
import { AIProviderFactory } from "../infrastructure/factories/AIProviderFactory.js";
import { colors, commitIcons, createGradient, icons } from "../theme/colors.js";
import type { AIProvider as AIProviderType, CommitConfig } from "../types.js";
import { Confirm } from "../ui/Confirm.js";
import { LoadingSpinner } from "./LoadingSpinner.js";

type Step =
  | "generating"
  | "reflecting-1"
  | "refining-1"
  | "reflecting-2"
  | "refining-2"
  | "preview"
  | "error";

interface Props {
  provider: AIProviderType;
  config: CommitConfig;
  onComplete: (message: string | null, fallbackToManual: boolean) => void;
}

// Global flag to prevent concurrent generations (React strict mode workaround)
let globalGenerationInProgress = false;

export const AgenticAICommitGenerator = ({
  provider,
  config,
  onComplete,
}: Props) => {
  const agenticUseCase = useAgenticCommitGeneration();

  const [step, setStep] = useState<Step>("generating");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgenticGenerationResult | null>(null);
  const [providerName, setProviderName] = useState<string>("");

  // Ref to prevent duplicate generations
  const isGenerating = useRef<boolean>(false);
  const hasGenerated = useRef<boolean>(false);
  const isMounted = useRef<boolean>(true);

  const generate = useCallback(async () => {
    // Prevent duplicate calls (local and global check)
    if (
      isGenerating.current ||
      hasGenerated.current ||
      !isMounted.current ||
      globalGenerationInProgress
    ) {
      if (process.env.GORTEX_DEBUG === "true") {
        console.log("[AgenticAICommitGenerator] Skipping generation:", {
          isGenerating: isGenerating.current,
          hasGenerated: hasGenerated.current,
          isMounted: isMounted.current,
          globalInProgress: globalGenerationInProgress,
        });
      }
      return;
    }

    isGenerating.current = true;
    globalGenerationInProgress = true;
    try {
      setStep("generating");

      // Create AI provider instance
      // biome-ignore lint/suspicious/noExplicitAny: Type narrowing needed
      const aiProvider = AIProviderFactory.create(provider as any, config.ai);
      setProviderName(aiProvider.getName());

      // Debug logging
      if (process.env.GORTEX_DEBUG === "true") {
        console.log(
          "[AgenticAICommitGenerator] Starting generation with provider:",
          aiProvider.getName(),
        );
      }

      // Execute agentic workflow with reflection
      const agenticResult = await agenticUseCase.execute({
        provider: aiProvider,
        includeScope: true,
        maxReflectionIterations: 2, // Default: max 2 reflection cycles
      });

      // Check if component is still mounted
      if (!isMounted.current) {
        if (process.env.GORTEX_DEBUG === "true") {
          console.log(
            "[AgenticAICommitGenerator] Component unmounted, ignoring result",
          );
        }
        return;
      }

      // Debug logging
      if (process.env.GORTEX_DEBUG === "true") {
        console.log(
          "[AgenticAICommitGenerator] Result:",
          JSON.stringify(
            {
              success: agenticResult.success,
              iterations: agenticResult.iterations,
              hasError: !!agenticResult.error,
              errorMessage: agenticResult.error || null,
            },
            null,
            2,
          ),
        );
      }

      if (!agenticResult.success) {
        setError(agenticResult.error || "AI generation failed");
        setStep("error");
        return;
      }

      setResult(agenticResult);
      setStep("preview");
      hasGenerated.current = true;
    } catch (err) {
      console.error("[AgenticAICommitGenerator] Error:", err);
      setError(err instanceof Error ? err.message : String(err));
      setStep("error");
      hasGenerated.current = true;
    } finally {
      isGenerating.current = false;
      globalGenerationInProgress = false;
    }
  }, [provider, config, agenticUseCase]);

  // Start generation on mount and cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    generate();

    return () => {
      isMounted.current = false;
      if (process.env.GORTEX_DEBUG === "true") {
        console.log("[AgenticAICommitGenerator] Component unmounting");
      }
    };
  }, [generate]);

  const handleConfirm = (confirmed: boolean) => {
    if (!confirmed) {
      onComplete(null, true);
      return;
    }

    if (result?.formattedMessage) {
      onComplete(result.formattedMessage, false);
    }
  };

  // Render generating state
  if (
    step === "generating" ||
    step.startsWith("reflecting") ||
    step.startsWith("refining")
  ) {
    const messages: Record<Step, string> = {
      generating: "Génération initiale du message...",
      "reflecting-1": "Réflexion sur la qualité (1/2)...",
      "refining-1": "Raffinement du message (1/2)...",
      "reflecting-2": "Réflexion finale sur la qualité (2/2)...",
      "refining-2": "Raffinement final du message (2/2)...",
      preview: "",
      error: "",
    };

    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text color={colors.secondary}>
            {createGradient.titanium("🤖 Mode Agentique (Reflection Pattern)")}
          </Text>
        </Box>
        <Box marginBottom={1}>
          <LoadingSpinner
            message={`${icons.star} ${messages[step] || "Traitement..."}`}
            variant="primary"
          />
        </Box>
        <Box>
          <Text dimColor>
            L'IA analyse, réfléchit et améliore le message de commit...
          </Text>
        </Box>
      </Box>
    );
  }

  // Render error state
  if (step === "error") {
    return (
      <Box flexDirection="column" padding={1}>
        <Box
          borderStyle="round"
          borderColor={colors.error}
          padding={1}
          flexDirection="column"
        >
          <Box marginBottom={1}>
            <Text color={colors.error} bold>
              {icons.error} Erreur lors de la génération
            </Text>
          </Box>

          <Box marginBottom={1}>
            <Text>{error}</Text>
          </Box>

          <Box>
            <Text dimColor>Retour au mode manuel...</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  // Render preview state with result
  if (step === "preview" && result) {
    const { iterations, finalQualityScore, performance } = result;

    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold>
            {createGradient.titanium(
              `${commitIcons.feat} Suggestion AI (${providerName})`,
            )}
          </Text>
        </Box>

        {/* Main commit message preview */}
        <Box
          borderStyle="round"
          borderColor={colors.info}
          paddingX={2}
          paddingY={1}
          flexDirection="column"
          marginBottom={1}
        >
          <Box marginBottom={1}>
            <Text dimColor>Message de commit proposé:</Text>
          </Box>

          <Box marginBottom={result.confidence !== undefined ? 1 : 0}>
            <Text bold>
              {createGradient.commitMessage(result.formattedMessage)}
            </Text>
          </Box>

          {result.confidence !== undefined && (
            <Box marginTop={0}>
              <Text dimColor>Confiance: {Math.round(result.confidence)}%</Text>
            </Box>
          )}
        </Box>

        {/* Agentic workflow metadata */}
        <Box
          borderStyle="round"
          borderColor={colors.borderLight}
          padding={1}
          flexDirection="column"
          marginBottom={1}
        >
          <Box marginBottom={1}>
            <Text dimColor>{icons.star} Métadonnées Agentiques</Text>
          </Box>

          <Box flexDirection="column">
            <Text dimColor>
              {icons.tick} Itérations: {iterations}{" "}
              {iterations === 1 ? "(accepté 1ère génération)" : "(raffiné)"}
            </Text>

            {finalQualityScore !== undefined && (
              <Text dimColor>
                {icons.tick} Score qualité: {finalQualityScore}/100
              </Text>
            )}

            {/* Phase 2: Display factual accuracy */}
            {result.finalFactualAccuracy !== undefined && (
              <Text dimColor>
                {icons.tick} Précision factuelle: {result.finalFactualAccuracy}
                /100
              </Text>
            )}

            <Text dimColor>
              {icons.tick} Temps total:{" "}
              {(performance.totalLatency / 1000).toFixed(1)}s
            </Text>

            <Text dimColor>
              - Génération: {(performance.generationTime / 1000).toFixed(1)}s
            </Text>

            {performance.reflectionTime > 0 && (
              <Text dimColor>
                - Réflexion: {(performance.reflectionTime / 1000).toFixed(1)}s
              </Text>
            )}

            {/* Phase 2: Display verification time */}
            {performance.verificationTime &&
              performance.verificationTime > 0 && (
                <Text dimColor>
                  - Vérification:{" "}
                  {(performance.verificationTime / 1000).toFixed(1)}s
                </Text>
              )}

            {performance.refinementTime > 0 && (
              <Text dimColor>
                - Raffinement: {(performance.refinementTime / 1000).toFixed(1)}s
              </Text>
            )}
          </Box>
        </Box>

        {/* Display reflections if in debug mode */}
        {process.env.GORTEX_DEBUG === "true" &&
          result.reflections.length > 0 && (
            <Box
              borderStyle="round"
              borderColor={colors.warning}
              padding={1}
              flexDirection="column"
              marginBottom={1}
            >
              <Box marginBottom={1}>
                <Text color={colors.warning} bold>
                  🔍 Réflexions (Mode Debug)
                </Text>
              </Box>

              {result.reflections.map((reflection, index) => (
                <Box key={index} flexDirection="column" marginBottom={1}>
                  <Text>
                    Itération {index + 1}: {reflection.decision.toUpperCase()}{" "}
                    (Score: {reflection.qualityScore}/100)
                  </Text>

                  {/* Afficher les scores par critère si disponibles (Phase 1) */}
                  {reflection.criteriaScores && (
                    <Box flexDirection="column" marginLeft={2} marginTop={1}>
                      <Text dimColor>Scores détaillés:</Text>
                      {Object.entries(reflection.criteriaScores).map(
                        ([key, score]) => (
                          <Text key={key} dimColor>
                            - {key}: {score}/100
                          </Text>
                        ),
                      )}
                    </Box>
                  )}

                  {reflection.issues.length > 0 && (
                    <Box flexDirection="column" marginLeft={2} marginTop={1}>
                      <Text dimColor>Problèmes:</Text>
                      {reflection.issues.map((issue, i) => (
                        <Text key={i} dimColor>
                          - {issue}
                        </Text>
                      ))}
                    </Box>
                  )}

                  {reflection.improvements.length > 0 && (
                    <Box flexDirection="column" marginLeft={2} marginTop={1}>
                      <Text dimColor>Améliorations:</Text>
                      {reflection.improvements.map((improvement, i) => (
                        <Text key={i} dimColor>
                          - {improvement}
                        </Text>
                      ))}
                    </Box>
                  )}

                  {/* Afficher les issues détaillées si disponibles (Phase 1) */}
                  {reflection.detailedIssues &&
                    reflection.detailedIssues.length > 0 && (
                      <Box flexDirection="column" marginLeft={2} marginTop={1}>
                        <Text dimColor>Actions recommandées:</Text>
                        {reflection.detailedIssues.map((issue, i) => (
                          <Text key={i} dimColor>
                            - {issue.criterion} ({issue.currentScore}→
                            {issue.targetScore}): {issue.actionable}
                          </Text>
                        ))}
                      </Box>
                    )}
                </Box>
              ))}
            </Box>
          )}

        {/* Phase 2: Display verifications if in debug mode */}
        {process.env.GORTEX_DEBUG === "true" &&
          result.verifications &&
          result.verifications.length > 0 && (
            <Box
              borderStyle="round"
              borderColor={colors.error}
              padding={1}
              flexDirection="column"
              marginBottom={1}
            >
              <Box marginBottom={1}>
                <Text color={colors.error} bold>
                  🔍 Vérifications Factuelles (Mode Debug - Phase 2)
                </Text>
              </Box>

              {result.verifications.map((verification, index) => (
                <Box key={index} flexDirection="column" marginBottom={1}>
                  <Text>
                    Vérification {index + 1}: Précision{" "}
                    {verification.factualAccuracy}/100
                    {verification.hasCriticalIssues && (
                      <Text color={colors.error}> (PROBLÈMES CRITIQUES)</Text>
                    )}
                  </Text>

                  {verification.hallucinatedSymbols.length > 0 && (
                    <Box flexDirection="column" marginLeft={2} marginTop={1}>
                      <Text color={colors.error}>
                        Hallucinations détectées:
                      </Text>
                      {verification.hallucinatedSymbols.map((symbol, i) => (
                        <Text key={i} color={colors.error}>
                          - {symbol} (mentionné mais absent du diff)
                        </Text>
                      ))}
                    </Box>
                  )}

                  {verification.missingSymbols.length > 0 && (
                    <Box flexDirection="column" marginLeft={2} marginTop={1}>
                      <Text color={colors.warning}>Symboles omis:</Text>
                      {verification.missingSymbols.map((symbol, i) => (
                        <Text key={i} color={colors.warning}>
                          - {symbol} (dans le diff mais non mentionné)
                        </Text>
                      ))}
                    </Box>
                  )}

                  {verification.issues.length > 0 && (
                    <Box flexDirection="column" marginLeft={2} marginTop={1}>
                      <Text dimColor>Problèmes détectés:</Text>
                      {verification.issues.map((issue, i) => (
                        <Text key={i} dimColor>
                          - [{issue.severity}] {issue.type}: {issue.description}
                        </Text>
                      ))}
                    </Box>
                  )}

                  {verification.recommendations.length > 0 && (
                    <Box flexDirection="column" marginLeft={2} marginTop={1}>
                      <Text dimColor>Recommandations:</Text>
                      {verification.recommendations.map((rec, i) => (
                        <Text key={i} dimColor>
                          - {rec}
                        </Text>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

        {/* Confirmation */}
        <Box marginTop={1}>
          <Confirm
            message="Utiliser ce message de commit?"
            onSubmit={handleConfirm}
          />
        </Box>
      </Box>
    );
  }

  return null;
};
