/**
 * Mapper to convert between CommitMessage domain entity and DTOs
 * Ensures clean separation between layers
 */

import { CommitMessage } from '../../domain/entities/CommitMessage.js';
import { CommitType } from '../../domain/value-objects/CommitType.js';
import { Scope } from '../../domain/value-objects/Scope.js';
import { CommitSubject } from '../../domain/value-objects/CommitSubject.js';
import { CommitMessageDTO, FormattedCommitDTO } from '../dto/CommitMessageDTO.js';

export class CommitMessageMapper {
  /**
   * Converts a CommitMessage domain entity to a DTO
   */
  static toDTO(entity: CommitMessage): CommitMessageDTO {
    return {
      type: entity.getType().getValue(),
      subject: entity.getSubject().getValue(),
      scope: entity.getScope().isEmpty() ? undefined : entity.getScope().getValue(),
      body: entity.getBody(),
      breaking: entity.isBreaking(),
      breakingChangeDescription: entity.getBreakingChangeDescription(),
    };
  }

  /**
   * Converts a DTO to a CommitMessage domain entity
   * @throws Error if DTO data is invalid
   */
  static toDomain(dto: CommitMessageDTO): CommitMessage {
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
  static toFormattedDTO(entity: CommitMessage): FormattedCommitDTO {
    return {
      message: entity.format(),
      type: entity.getType().getValue(),
      scope: entity.getScope().isEmpty() ? undefined : entity.getScope().getValue(),
      subject: entity.getSubject().getValue(),
    };
  }

  /**
   * Validates a DTO before conversion
   */
  static validateDTO(dto: CommitMessageDTO): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dto.type || typeof dto.type !== 'string') {
      errors.push('Type is required and must be a string');
    }

    if (!dto.subject || typeof dto.subject !== 'string') {
      errors.push('Subject is required and must be a string');
    }

    if (dto.subject && dto.subject.trim().length < 3) {
      errors.push('Subject must be at least 3 characters');
    }

    if (dto.breaking && !dto.breakingChangeDescription) {
      // This is a warning, not a hard error
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
