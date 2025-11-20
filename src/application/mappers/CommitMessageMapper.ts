/**
 * Mapper to convert between CommitMessage domain entity and DTOs
 * Ensures clean separation between layers
 */

import { CommitMessage } from "../../domain/entities/CommitMessage.js";
import { CommitSubject } from "../../domain/value-objects/CommitSubject.js";
import { CommitType } from "../../domain/value-objects/CommitType.js";
import { Scope } from "../../domain/value-objects/Scope.js";
import type {
  CommitMessageDTO,
  FormattedCommitDTO,
} from "../dto/CommitMessageDTO.js";

/**
 * Converts a CommitMessage domain entity to a DTO
 */
export function toDTO(entity: CommitMessage): CommitMessageDTO {
  return {
    type: entity.getType().getValue(),
    subject: entity.getSubject().getValue(),
    scope: entity.getScope().isEmpty()
      ? undefined
      : entity.getScope().getValue(),
    body: entity.getBody(),
    breaking: entity.isBreaking(),
    breakingChangeDescription: entity.getBreakingChangeDescription(),
  };
}

/**
 * Converts a DTO to a CommitMessage domain entity
 * @throws Error if DTO data is invalid
 */
export function toDomain(dto: CommitMessageDTO): CommitMessage {
  return CommitMessage.create({
    type: CommitType.create(dto.type),
    subject: CommitSubject.create(dto.subject),
    scope: dto.scope ? Scope.create(dto.scope) : undefined,
    body: dto.body,
    breaking: dto.breaking,
    breakingChangeDescription: dto.breakingChangeDescription,
  });
}

/**
 * Converts a CommitMessage to a formatted DTO
 */
export function toFormattedDTO(entity: CommitMessage): FormattedCommitDTO {
  return {
    message: entity.format(),
    type: entity.getType().getValue(),
    scope: entity.getScope().isEmpty()
      ? undefined
      : entity.getScope().getValue(),
    subject: entity.getSubject().getValue(),
  };
}

/**
 * Parses a formatted conventional commit message string to a DTO
 * Format: type(scope): subject\n\nbody\n\nBREAKING CHANGE: description
 */
export function fromFormattedString(
  formattedMessage: string,
): CommitMessageDTO {
  const lines = formattedMessage.split("\n");
  const firstLine = lines[0] || "";

  // Parse first line: type(scope): subject or type: subject
  const match = firstLine.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);
  if (!match) {
    // If parsing fails, treat entire message as subject with type 'chore'
    return {
      type: "chore",
      subject: formattedMessage.trim() || "commit",
    };
  }

  const [, type, scope, subject] = match;

  // Extract body (lines between first line and BREAKING CHANGE if present)
  let body: string | undefined;
  let breaking = false;
  let breakingChangeDescription: string | undefined;

  if (lines.length > 1) {
    const restOfMessage = lines.slice(1).join("\n");
    const breakingMatch = restOfMessage.match(/BREAKING CHANGE:\s*(.+)/s);

    if (breakingMatch) {
      breaking = true;
      breakingChangeDescription = breakingMatch[1].trim();
      // Body is everything before BREAKING CHANGE
      const bodyPart = restOfMessage.split("BREAKING CHANGE:")[0].trim();
      body = bodyPart || undefined;
    } else {
      body = restOfMessage.trim() || undefined;
    }
  }

  return {
    type,
    subject,
    scope: scope || undefined,
    body,
    breaking,
    breakingChangeDescription,
  };
}

/**
 * Validates a DTO before conversion
 */
export function validateDTO(dto: CommitMessageDTO): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!dto.type || typeof dto.type !== "string") {
    errors.push("Type is required and must be a string");
  }

  if (!dto.subject || typeof dto.subject !== "string") {
    errors.push("Subject is required and must be a string");
  }

  if (dto.subject && dto.subject.trim().length < 3) {
    errors.push("Subject must be at least 3 characters");
  }

  if (dto.breaking && !dto.breakingChangeDescription) {
    // This is a warning, not a hard error
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * @deprecated Use individual exported functions instead
 * @see {toDTO}, {toDomain}, {toFormattedDTO}, {fromFormattedString}, {validateDTO}
 */
export const CommitMessageMapper = {
  toDTO,
  toDomain,
  toFormattedDTO,
  fromFormattedString,
  validateDTO,
};
