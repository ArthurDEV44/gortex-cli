/**
 * Stats Display Component
 * Displays commit statistics using DI architecture
 */

import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { useEffect, useState } from "react";
import type { RepositoryStatsDTO } from "../application/dto/GitStatusDTO.js";
import { useCommitHistory } from "../infrastructure/di/hooks.js";
import { getCommitTypeEmoji } from "../shared/constants/index.js";

interface Props {
  maxCount?: number;
}

export function StatsDisplay({ maxCount = 100 }: Props) {
  const analyzeHistoryUseCase = useCommitHistory();
  const [stats, setStats] = useState<RepositoryStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);
      const result = await analyzeHistoryUseCase.execute({ maxCount });
      if (result.success && result.stats) {
        setStats(result.stats);
      } else {
        setError(result.error || "Erreur lors de l'analyse");
      }
      setLoading(false);
    }
    loadStats();
  }, [maxCount, analyzeHistoryUseCase]);

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan">
          <Spinner type="dots" /> Analyse des {maxCount} derniers commits...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">❌ Erreur: {error}</Text>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">Aucune statistique disponible</Text>
      </Box>
    );
  }

  const percentage = stats.conventionalPercentage.toFixed(1);
  const percentageNum = Number.parseFloat(percentage);
  const color =
    percentageNum >= 80 ? "green" : percentageNum >= 50 ? "yellow" : "red";
  const nonConventional = stats.totalCommits - stats.conventionalCommits;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Title */}
      <Box marginBottom={1}>
        <Text color="blue" bold>
          📊 Analyse des {maxCount} derniers commits
        </Text>
      </Box>

      {/* Summary */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Résumé:</Text>
        <Text color="gray">{"─".repeat(50)}</Text>
        <Text>
          Total de commits analysés:{" "}
          <Text color="cyan">{stats.totalCommits}</Text>
        </Text>
        <Text>
          Commits conventionnels:{" "}
          <Text color="green">{stats.conventionalCommits}</Text>
        </Text>
        <Text>
          Commits non-conventionnels: <Text color="red">{nonConventional}</Text>
        </Text>
      </Box>

      {/* Compliance Rate */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Taux de conformité:</Text>
        <Text color={color}>
          {percentage}% {getProgressBar(percentageNum)}
        </Text>
      </Box>

      {/* Type Breakdown */}
      {Object.keys(stats.typeBreakdown).length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold>Répartition par type:</Text>
          <Text color="gray">{"─".repeat(50)}</Text>
          <Box flexDirection="column">
            {Object.entries(stats.typeBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const typePercentage = (
                  (count / stats.conventionalCommits) *
                  100
                ).toFixed(1);
                const bar = getProgressBar(
                  (count / stats.conventionalCommits) * 100,
                  20,
                );
                return (
                  <Text key={type}>
                    {getCommitTypeEmoji(type)} {type.padEnd(10)}{" "}
                    {count.toString().padStart(3)} ({typePercentage}%){" "}
                    <Text color="gray">{bar}</Text>
                  </Text>
                );
              })}
          </Box>
        </Box>
      )}

      {/* Recommendations */}
      {percentageNum < 80 ? (
        <Box flexDirection="column">
          <Text color="yellow" bold>
            💡 Recommandations:
          </Text>
          <Text color="gray">{"─".repeat(50)}</Text>
          <Text> • Utilisez "npx gortex" pour créer des commits guidés</Text>
          <Text> • Installez le hook Git: "npx gortex hooks install"</Text>
          <Text> • Partagez les bonnes pratiques avec votre équipe</Text>
        </Box>
      ) : (
        <Box>
          <Text color="green" bold>
            🎉 Excellent travail ! Votre repo suit bien les conventions de
            commits.
          </Text>
        </Box>
      )}
    </Box>
  );
}

function getProgressBar(percentage: number, length = 30): string {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}
