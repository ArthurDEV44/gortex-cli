import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderNotAvailableError } from '../providers/base.js';
import type { AIConfig, CommitConfig, AIGeneratedCommit } from '../../types.js';

// Mock des providers - créer une factory qui retourne toujours une instance avec les méthodes mockées
const createMockProviderInstance = () => ({
  generateCommitMessage: vi.fn(),
  isAvailable: vi.fn(),
  getName: vi.fn(),
});

// Stocker l'instance actuelle dans un objet mutable (référence qui peut être modifiée)
const mockProviderRef: { current: ReturnType<typeof createMockProviderInstance> } = {
  current: createMockProviderInstance(),
};

// Fonction pour obtenir l'instance actuelle (appelée au moment de l'exécution)
const getMockProvider = () => mockProviderRef.current;

// Les mocks doivent être définis AVANT les imports (hoisting)
// Définir les classes directement dans le factory pour éviter les problèmes de hoisting
vi.mock('../providers/ollama.js', () => {
  class MockOllamaProvider {
    constructor() {
      return mockProviderRef.current;
    }
  }
  return {
    OllamaProvider: MockOllamaProvider,
  };
});

vi.mock('../providers/mistral.js', () => {
  class MockMistralProvider {
    constructor() {
      return mockProviderRef.current;
    }
  }
  return {
    MistralProvider: MockMistralProvider,
  };
});

vi.mock('../providers/openai.js', () => {
  class MockOpenAIProvider {
    constructor() {
      return mockProviderRef.current;
    }
  }
  return {
    OpenAIProvider: MockOpenAIProvider,
  };
});

// Imports après les mocks
import { createAIProvider, AICommitService } from '../index.js';

describe('AI Module', () => {
  describe('createAIProvider', () => {
    it('should create OllamaProvider when provider is "ollama"', () => {
      const config: AIConfig = {
        provider: 'ollama',
        enabled: true,
      };

      const provider = createAIProvider(config);
      // Le constructeur mocké retourne directement notre instance
      expect(provider).toBe(mockProviderRef.current);
      expect(provider.generateCommitMessage).toBeDefined();
      expect(provider.isAvailable).toBeDefined();
      expect(provider.getName).toBeDefined();
      // Vérifier que le provider a les méthodes attendues d'un AIProvider
      expect(typeof provider.generateCommitMessage).toBe('function');
      expect(typeof provider.isAvailable).toBe('function');
      expect(typeof provider.getName).toBe('function');
    });

    it('should create MistralProvider when provider is "mistral"', () => {
      const config: AIConfig = {
        provider: 'mistral',
        enabled: true,
        mistral: {
          apiKey: 'test-key',
        },
      };

      const provider = createAIProvider(config);
      expect(provider).toBe(mockProviderRef.current);
      expect(provider.generateCommitMessage).toBeDefined();
      expect(provider.isAvailable).toBeDefined();
      expect(provider.getName).toBeDefined();
      expect(typeof provider.generateCommitMessage).toBe('function');
      expect(typeof provider.isAvailable).toBe('function');
      expect(typeof provider.getName).toBe('function');
    });

    it('should create OpenAIProvider when provider is "openai"', () => {
      const config: AIConfig = {
        provider: 'openai',
        enabled: true,
        openai: {
          apiKey: 'test-key',
        },
      };

      const provider = createAIProvider(config);
      expect(provider).toBe(mockProviderRef.current);
      expect(provider.generateCommitMessage).toBeDefined();
      expect(provider.isAvailable).toBeDefined();
      expect(provider.getName).toBeDefined();
      expect(typeof provider.generateCommitMessage).toBe('function');
      expect(typeof provider.isAvailable).toBe('function');
      expect(typeof provider.getName).toBe('function');
    });

    it('should default to OllamaProvider when provider is not specified', () => {
      const config: AIConfig = {
        enabled: true,
      };

      const provider = createAIProvider(config);
      expect(provider).toBe(mockProviderRef.current);
      expect(provider.generateCommitMessage).toBeDefined();
      expect(provider.isAvailable).toBeDefined();
      expect(provider.getName).toBeDefined();
      expect(typeof provider.generateCommitMessage).toBe('function');
      expect(typeof provider.isAvailable).toBe('function');
      expect(typeof provider.getName).toBe('function');
    });

    it('should throw ProviderNotAvailableError when provider is "disabled"', () => {
      const config: AIConfig = {
        provider: 'disabled',
        enabled: true,
      };

      expect(() => createAIProvider(config)).toThrow(ProviderNotAvailableError);
      expect(() => createAIProvider(config)).toThrow('AI désactivé dans la configuration');
    });

    it('should throw Error for unknown provider', () => {
      const config: AIConfig = {
        provider: 'unknown-provider' as any,
        enabled: true,
      };

      expect(() => createAIProvider(config)).toThrow('Provider inconnu: unknown-provider');
    });
  });

  describe('AICommitService', () => {
    beforeEach(() => {
      // Réinitialiser l'instance mockée en modifiant la référence (pas l'objet lui-même)
      mockProviderRef.current = createMockProviderInstance();
    });

    describe('constructor', () => {
      it('should create service with valid config', () => {
        const config: CommitConfig = {
          ai: {
            provider: 'ollama',
            enabled: true,
          },
        };

        const service = new AICommitService(config);
        expect(service).toBeInstanceOf(AICommitService);
      });

      it('should throw error when AI is not enabled', () => {
        const config: CommitConfig = {
          ai: {
            provider: 'ollama',
            enabled: false,
          },
        };

        expect(() => new AICommitService(config)).toThrow('AI non activé dans la configuration');
      });

      it('should throw error when AI config is missing', () => {
        const config: CommitConfig = {} as CommitConfig;

        expect(() => new AICommitService(config)).toThrow('AI non activé dans la configuration');
      });
    });

    describe('generateCommitMessage', () => {
      it('should generate commit message with full context', async () => {
        const config: CommitConfig = {
          ai: {
            provider: 'ollama',
            enabled: true,
          },
          types: [
            { value: 'feat', name: 'Feature', description: 'A new feature' },
            { value: 'fix', name: 'Fix', description: 'A bug fix' },
          ],
          scopes: ['auth', 'api'],
        };
        
        const mockCommit: AIGeneratedCommit = {
          type: 'feat',
          subject: 'add new feature',
          scope: 'auth',
          breaking: false,
          confidence: 90,
        };

        // S'assurer que l'instance mockée est bien configurée AVANT de créer le service
        const mockInstance = mockProviderRef.current;
        mockInstance.generateCommitMessage.mockResolvedValue(mockCommit);
        
        // Vérifier que l'instance a bien les méthodes
        expect(mockInstance).toBeDefined();
        expect(mockInstance.generateCommitMessage).toBeDefined();
        expect(typeof mockInstance.generateCommitMessage).toBe('function');
        
        const service = new AICommitService(config);
        
        // Vérifier que le provider créé est bien notre instance mockée
        const provider = (service as any).provider;
        expect(provider).toBeDefined();
        expect(provider).toBe(mockInstance);
        expect(provider.generateCommitMessage).toBeDefined();
        expect(typeof provider.generateCommitMessage).toBe('function');
        
        const result = await service.generateCommitMessage(
          'test diff',
          {
            files: ['file1.ts'],
            branch: 'main',
            recentCommits: [],
          },
        );

        expect(result).toEqual(mockCommit);
        expect(mockInstance.generateCommitMessage).toHaveBeenCalledWith('test diff', {
          files: ['file1.ts'],
          branch: 'main',
          recentCommits: [],
          availableTypes: ['feat', 'fix'],
          availableScopes: ['auth', 'api'],
        });
      });

      it('should handle config without types', async () => {
        const config: CommitConfig = {
          ai: {
            provider: 'ollama',
            enabled: true,
          },
          scopes: ['auth'],
        };

        const mockCommit: AIGeneratedCommit = {
          type: 'feat',
          subject: 'add new feature',
          breaking: false,
          confidence: 90,
        };

        mockProviderRef.current.generateCommitMessage.mockResolvedValue(mockCommit);
        
        const service = new AICommitService(config);
        await service.generateCommitMessage('test diff', {
          files: ['file1.ts'],
          branch: 'main',
          recentCommits: [],
        });

        expect(mockProviderRef.current.generateCommitMessage).toHaveBeenCalledWith('test diff', {
          files: ['file1.ts'],
          branch: 'main',
          recentCommits: [],
          availableTypes: [],
          availableScopes: ['auth'],
        });
      });

      it('should handle config without scopes', async () => {
        const config: CommitConfig = {
          ai: {
            provider: 'ollama',
            enabled: true,
          },
          types: [{ value: 'feat', name: 'Feature', description: 'A new feature' }],
        };

        const mockCommit: AIGeneratedCommit = {
          type: 'feat',
          subject: 'add new feature',
          breaking: false,
          confidence: 90,
        };

        mockProviderRef.current.generateCommitMessage.mockResolvedValue(mockCommit);
        
        const service = new AICommitService(config);
        await service.generateCommitMessage('test diff', {
          files: ['file1.ts'],
          branch: 'main',
          recentCommits: [],
        });

        expect(mockProviderRef.current.generateCommitMessage).toHaveBeenCalledWith('test diff', {
          files: ['file1.ts'],
          branch: 'main',
          recentCommits: [],
          availableTypes: ['feat'],
          availableScopes: [],
        });
      });
    });

    describe('isAvailable', () => {
      it('should check if provider is available', async () => {
        const config: CommitConfig = {
          ai: {
            provider: 'ollama',
            enabled: true,
          },
        };

        mockProviderRef.current.isAvailable.mockResolvedValue(true);
        
        const service = new AICommitService(config);
        const result = await service.isAvailable();

        expect(result).toBe(true);
        expect(mockProviderRef.current.isAvailable).toHaveBeenCalled();
      });

      it('should return false when provider is not available', async () => {
        const config: CommitConfig = {
          ai: {
            provider: 'ollama',
            enabled: true,
          },
        };

        mockProviderRef.current.isAvailable.mockResolvedValue(false);
        
        const service = new AICommitService(config);
        const result = await service.isAvailable();

        expect(result).toBe(false);
      });
    });

    describe('getProviderName', () => {
      it('should return provider name', () => {
        const config: CommitConfig = {
          ai: {
            provider: 'ollama',
            enabled: true,
          },
        };

        mockProviderRef.current.getName.mockReturnValue('Ollama');
        
        const service = new AICommitService(config);
        const result = service.getProviderName();

        expect(result).toBe('Ollama');
        expect(mockProviderRef.current.getName).toHaveBeenCalled();
      });
    });
  });
});
