import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_CONFIG } from '../../types.js';

// Create mock functions that will be reused
const createMockCosmiconfigSearch = () => vi.fn();

describe('loadConfig', () => {
  let loadConfig: any;
  let mockSearch: ReturnType<typeof createMockCosmiconfigSearch>;

  beforeEach(async () => {
    vi.resetModules();
    mockSearch = createMockCosmiconfigSearch();

    // Mock cosmiconfig before importing loadConfig
    vi.doMock('cosmiconfig', () => ({
      cosmiconfig: vi.fn(() => ({
        search: mockSearch,
      })),
    }));

    // Dynamically import loadConfig after mocking
    const module = await import('../config.js');
    loadConfig = module.loadConfig;
  });

  it('should return default config when no config file is found', async () => {
    mockSearch.mockResolvedValue(null);

    const config = await loadConfig();

    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('should return default config when config result is empty', async () => {
    mockSearch.mockResolvedValue({});

    const config = await loadConfig();

    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('should merge custom config with default config', async () => {
    const customConfig = {
      maxSubjectLength: 60,
      maxBodyLineLength: 80,
    };

    mockSearch.mockResolvedValue({
      config: customConfig,
      filepath: '.gortexrc',
    });

    const config = await loadConfig();

    expect(config.maxSubjectLength).toBe(60);
    expect(config.maxBodyLineLength).toBe(80);
    expect(config.types).toEqual(DEFAULT_CONFIG.types);
  });

  it('should merge custom types with default config', async () => {
    const customTypes = [
      { value: 'feat', label: 'Feature' },
      { value: 'fix', label: 'Bug Fix' },
    ];

    mockSearch.mockResolvedValue({
      config: {
        types: customTypes,
      },
      filepath: '.gortexrc.json',
    });

    const config = await loadConfig();

    expect(config.types).toEqual(customTypes);
  });

  it('should merge AI config correctly', async () => {
    const customAIConfig = {
      ai: {
        defaultProvider: 'openai',
        ollama: {
          baseUrl: 'http://custom:11434',
          model: 'custom-model',
        },
      },
    };

    mockSearch.mockResolvedValue({
      config: customAIConfig,
      filepath: 'gortex.config.js',
    });

    const config = await loadConfig();

    expect(config.ai?.defaultProvider).toBe('openai');
    expect(config.ai?.ollama?.baseUrl).toBe('http://custom:11434');
    expect(config.ai?.ollama?.model).toBe('custom-model');
    // Should preserve default values for other providers
    expect(config.ai?.mistral).toEqual(DEFAULT_CONFIG.ai?.mistral);
  });

  it('should merge partial AI provider config with defaults', async () => {
    const partialConfig = {
      ai: {
        ollama: {
          model: 'custom-model',
          // baseUrl should come from default
        },
      },
    };

    mockSearch.mockResolvedValue({
      config: partialConfig,
      filepath: '.gortexrc',
    });

    const config = await loadConfig();

    expect(config.ai?.ollama?.model).toBe('custom-model');
    expect(config.ai?.ollama?.baseUrl).toBe(DEFAULT_CONFIG.ai?.ollama?.baseUrl);
  });

  it('should handle multiple AI provider configs', async () => {
    const multiProviderConfig = {
      ai: {
        ollama: {
          model: 'llama3',
        },
        mistral: {
          model: 'mistral-large',
        },
        openai: {
          model: 'gpt-4',
        },
      },
    };

    mockSearch.mockResolvedValue({
      config: multiProviderConfig,
      filepath: '.gortexrc.json',
    });

    const config = await loadConfig();

    expect(config.ai?.ollama?.model).toBe('llama3');
    expect(config.ai?.mistral?.model).toBe('mistral-large');
    expect(config.ai?.openai?.model).toBe('gpt-4');
  });

  it('should return default config on error', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockSearch.mockRejectedValue(new Error('File read error'));

    const config = await loadConfig();

    expect(config).toEqual(DEFAULT_CONFIG);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Erreur lors du chargement de la configuration, utilisation de la config par défaut'
    );

    consoleWarnSpy.mockRestore();
  });

  it('should preserve default AI config when no AI config is provided', async () => {
    mockSearch.mockResolvedValue({
      config: {
        maxSubjectLength: 100,
      },
      filepath: '.gortexrc',
    });

    const config = await loadConfig();

    expect(config.ai).toEqual(DEFAULT_CONFIG.ai);
  });
});
