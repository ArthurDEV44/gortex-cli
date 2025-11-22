import { describe, it, expect } from 'vitest';
import { CommitMessageMapper } from '../CommitMessageMapper.js';
import { CommitMessage } from '../../../domain/entities/CommitMessage.js';
import { CommitType } from '../../../domain/value-objects/CommitType.js';
import { Scope } from '../../../domain/value-objects/Scope.js';
import { CommitSubject } from '../../../domain/value-objects/CommitSubject.js';
import { CommitMessageDTO } from '../../dto/CommitMessageDTO.js';

describe('CommitMessageMapper', () => {
  describe('toDTO', () => {
    it('should convert simple commit message to DTO', () => {
      const entity = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add new feature'),
      });

      const dto = CommitMessageMapper.toDTO(entity);

      expect(dto).toEqual({
        type: 'feat',
        subject: 'add new feature',
        scope: undefined,
        body: undefined,
        breaking: false,
        breakingChangeDescription: undefined,
      });
    });

    it('should convert commit message with scope to DTO', () => {
      const entity = CommitMessage.create({
        type: CommitType.create('fix'),
        subject: CommitSubject.create('resolve bug'),
        scope: Scope.create('api'),
      });

      const dto = CommitMessageMapper.toDTO(entity);

      expect(dto.type).toBe('fix');
      expect(dto.subject).toBe('resolve bug');
      expect(dto.scope).toBe('api');
    });

    it('should convert breaking change to DTO', () => {
      const entity = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('change API'),
        breaking: true,
        breakingChangeDescription: 'API changed',
      });

      const dto = CommitMessageMapper.toDTO(entity);

      expect(dto.breaking).toBe(true);
      expect(dto.breakingChangeDescription).toBe('API changed');
    });
  });

  describe('toDomain', () => {
    it('should convert simple DTO to domain entity', () => {
      const dto: CommitMessageDTO = {
        type: 'feat',
        subject: 'add feature',
      };

      const entity = CommitMessageMapper.toDomain(dto);

      expect(entity.getType().getValue()).toBe('feat');
      expect(entity.getSubject().getValue()).toBe('add feature');
      expect(entity.getScope().isEmpty()).toBe(true);
    });

    it('should convert DTO with scope to domain entity', () => {
      const dto: CommitMessageDTO = {
        type: 'fix',
        subject: 'fix bug',
        scope: 'ui',
      };

      const entity = CommitMessageMapper.toDomain(dto);

      expect(entity.getScope().getValue()).toBe('ui');
    });

    it('should throw error for invalid type', () => {
      const dto: CommitMessageDTO = {
        type: 'invalid',
        subject: 'some subject',
      };

      expect(() => CommitMessageMapper.toDomain(dto)).toThrow('Invalid commit type');
    });

    it('should throw error for invalid subject', () => {
      const dto: CommitMessageDTO = {
        type: 'feat',
        subject: 'ab', // Too short
      };

      expect(() => CommitMessageMapper.toDomain(dto)).toThrow('too short');
    });
  });

  describe('toFormattedDTO', () => {
    it('should create formatted DTO', () => {
      const entity = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add feature'),
        scope: Scope.create('api'),
      });

      const dto = CommitMessageMapper.toFormattedDTO(entity);

      expect(dto.message).toBe('feat(api): add feature');
      expect(dto.type).toBe('feat');
      expect(dto.scope).toBe('api');
      expect(dto.subject).toBe('add feature');
    });
  });

  describe('validateDTO', () => {
    it('should validate correct DTO', () => {
      const dto: CommitMessageDTO = {
        type: 'feat',
        subject: 'add feature',
      };

      const result = CommitMessageMapper.validateDTO(dto);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing type', () => {
      const dto = {
        subject: 'add feature',
      } as CommitMessageDTO;

      const result = CommitMessageMapper.validateDTO(dto);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Type is required and must be a string');
    });

    it('should detect missing subject', () => {
      const dto = {
        type: 'feat',
      } as CommitMessageDTO;

      const result = CommitMessageMapper.validateDTO(dto);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Subject is required and must be a string');
    });

    it('should detect too short subject', () => {
      const dto: CommitMessageDTO = {
        type: 'feat',
        subject: 'ab',
      };

      const result = CommitMessageMapper.validateDTO(dto);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Subject must be at least 3 characters');
    });

    it('should accept valid DTO with all fields', () => {
      const dto: CommitMessageDTO = {
        type: 'feat',
        subject: 'add new feature',
        scope: 'api',
        body: 'This is the body',
        breaking: true,
        breakingChangeDescription: 'Breaking change desc',
      };

      const result = CommitMessageMapper.validateDTO(dto);

      expect(result.valid).toBe(true);
    });
  });
});
