/**
 * Data Transfer Objects for AI generation results
 */

import { CommitMessageDTO } from './CommitMessageDTO.js';

export interface AIGenerationRequestDTO {
  readonly provider: string;
  readonly includeContext?: boolean;
}

export interface AIGenerationResultDTO {
  readonly success: boolean;
  readonly commit?: CommitMessageDTO;
  readonly formattedMessage?: string;
  readonly provider: string;
  readonly confidence?: number;
  readonly error?: string;
}

export interface AvailableProvidersDTO {
  readonly providers: Array<{
    name: string;
    available: boolean;
    configured: boolean;
  }>;
}
