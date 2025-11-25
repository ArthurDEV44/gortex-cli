import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { useEffect, useState } from "react";
import { useCommitHistory } from "../infrastructure/di/hooks.js";
import {
  colors,
  createGradient,
  getCommitIcon,
  icons,
} from "../theme/colors.js";

interface StatsData {
  total: number;
  conventional: number;
  nonConventional: number;
  percentage: number;
  typeBreakdown: Record<string, number>;
}

function getProgressBar(percentage: number, length = 30): string {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

// Supprimé - on utilise maintenant getCommitIcon() du thème

export const StatsTab = () => {
  const analyzeCommitHistoryUseCase = useCommitHistory();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);

        // Use clean architecture use case to analyze commit history
        const result = await analyzeCommitHistoryUseCase.execute({
          maxCount: 100,
        });

        if (!result.success || !result.stats) {
          setError(result.error || "Failed to load stats");
          return;
        }

        // Map DTO to component format
        const statsDTO = result.stats;
        setStats({
          total: statsDTO.totalCommits,
          conventional: statsDTO.conventionalCommits,
          nonConventional: statsDTO.totalCommits - statsDTO.conventionalCommits,
          percentage: statsDTO.conventionalPercentage,
          typeBreakdown: statsDTO.typeBreakdown,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [analyzeCommitHistoryUseCase.execute]);

  if (loading) {
    return (
      <Box padding={1}>
        <Text color={colors.primary}>
          <Spinner type="dots" /> Analyzing commits...
        </Text>
      </Box>
    );
  }

  if (error || !stats) {
    return (
      <Box padding={1}>
        <Text color={colors.error}>
          {icons.error} Error loading stats: {error || "Unknown error"}
        </Text>
      </Box>
    );
  }

  const percentage = stats.percentage.toFixed(1);
  const percentageColor =
    stats.percentage >= 80
      ? colors.success
      : stats.percentage >= 50
        ? colors.warning
        : colors.error;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Summary Section */}
      <Box
        borderStyle="round"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
        flexDirection="column"
      >
        <Box marginBottom={1}>
          <Text bold>
            {createGradient.commitMessage(`${icons.stats} Summary`)}
          </Text>
        </Box>

        <Box flexDirection="column">
          <Box>
            <Text>Total commits analyzed: </Text>
            <Text color={colors.primary}>{stats.total}</Text>
          </Box>
          <Box>
            <Text>Conventional commits: </Text>
            <Text color={colors.success}>{stats.conventional}</Text>
          </Box>
          <Box>
            <Text>Non-conventional commits: </Text>
            <Text color={colors.error}>{stats.nonConventional}</Text>
          </Box>
        </Box>
      </Box>

      {/* Compliance Rate */}
      <Box
        marginTop={1}
        borderStyle="round"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
        flexDirection="column"
      >
        <Box marginBottom={1}>
          <Text bold>
            {createGradient.commitMessage(`${icons.arrowUp} Compliance Rate`)}
          </Text>
        </Box>
        <Box>
          <Text color={percentageColor}>
            {percentage}% {getProgressBar(stats.percentage)}
          </Text>
        </Box>
      </Box>

      {/* Type Breakdown */}
      {Object.keys(stats.typeBreakdown).length > 0 && (
        <Box
          marginTop={1}
          borderStyle="round"
          borderColor={colors.border}
          paddingX={2}
          paddingY={1}
          flexDirection="column"
        >
          <Box marginBottom={1}>
            <Text bold>
              {createGradient.commitMessage(`${icons.menu} Type Breakdown`)}
            </Text>
          </Box>

          <Box flexDirection="column">
            {Object.entries(stats.typeBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const typePercentage = (
                  (count / stats.conventional) *
                  100
                ).toFixed(1);
                const bar = getProgressBar(
                  (count / stats.conventional) * 100,
                  20,
                );
                return (
                  <Box key={type}>
                    <Text>
                      {getCommitIcon(type)} {type.padEnd(10)}{" "}
                      {count.toString().padStart(3)} ({typePercentage}%){" "}
                      <Text dimColor>{bar}</Text>
                    </Text>
                  </Box>
                );
              })}
          </Box>
        </Box>
      )}

      {/* Recommendations */}
      <Box marginTop={1} flexDirection="column">
        {stats.percentage < 80 ? (
          <Box
            borderStyle="round"
            borderColor={colors.borderLight}
            paddingX={2}
            paddingY={1}
            flexDirection="column"
          >
            <Box marginBottom={1}>
              <Text color={colors.warning} bold>
                {icons.info} Recommendations
              </Text>
            </Box>
            <Box flexDirection="column">
              <Text dimColor>• Use "gortex commit" for guided commits</Text>
              <Text dimColor>• Install Git hooks: "gortex hooks install"</Text>
              <Text dimColor>• Share best practices with your team</Text>
            </Box>
          </Box>
        ) : (
          <Box
            borderStyle="round"
            borderColor={colors.borderLight}
            paddingX={2}
            paddingY={1}
          >
            <Text bold>
              {createGradient.commitMessage(
                `${icons.success} Excellent work! Your repo follows commit conventions well.`,
              )}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
