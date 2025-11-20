import { COMMIT_TYPES } from "./shared/constants/index.js";

export interface CommitType {
  value: string;
  name: string;
  description: string;
}

export interface CommitConfig {
  types?: CommitType[];
  scopes?: string[];
  allowCustomScopes?: boolean;
  maxSubjectLength?: number;
  minSubjectLength?: number;
  ai?: AIConfig;
}

export interface CommitAnswers {
  type: string;
  scope: string;
  subject: string;
  body?: string;
  breaking?: boolean;
  breakingDescription?: string;
}

export interface CommitStats {
  total: number;
  conventional: number;
  nonConventional: number;
  percentage: number;
  typeBreakdown: Record<string, number>;
}

// ============================================
// AI Configuration Types
// ============================================

export type AIProvider = "ollama" | "mistral" | "openai" | "disabled";

export interface AIConfig {
  enabled?: boolean;
  provider?: AIProvider;

  // Ollama configuration
  ollama?: {
    model?: string;
    baseUrl?: string;
    timeout?: number;
  };

  // Mistral API configuration
  mistral?: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  };

  // OpenAI API configuration
  openai?: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  };

  // Generation parameters
  temperature?: number;
  maxTokens?: number;

  // Behavior
  autoSuggest?: boolean; // Suggère automatiquement dans le workflow
  requireConfirmation?: boolean; // Demande confirmation avant d'utiliser la suggestion
}

export interface AIGeneratedCommit {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  breaking?: boolean;
  breakingDescription?: string;
  confidence?: number; // 0-100
  reasoning?: string; // Pourquoi l'AI a choisi ces valeurs
}

/**
 * Default commit types for conventional commits
 * Maps from centralized COMMIT_TYPES to maintain backward compatibility
 */
export const DEFAULT_TYPES: CommitType[] = COMMIT_TYPES.map((type) => ({
  value: type.value,
  name: type.name,
  description: type.description,
}));

export const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: false,
  provider: "ollama",
  ollama: {
    model: "mistral:7b",
    baseUrl: "http://localhost:11434",
    timeout: 30000,
  },
  mistral: {
    model: "mistral-small-latest",
    baseUrl: "https://api.mistral.ai",
  },
  openai: {
    model: "gpt-4o-mini",
    baseUrl: "https://api.openai.com",
  },
  temperature: 0.3,
  maxTokens: 500,
  autoSuggest: false,
  requireConfirmation: true,
};

export const DEFAULT_CONFIG: CommitConfig = {
  types: DEFAULT_TYPES,
  scopes: [],
  allowCustomScopes: true,
  maxSubjectLength: 100,
  minSubjectLength: 3,
  ai: DEFAULT_AI_CONFIG,
};
