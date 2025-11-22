import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiSuggestCommand } from './ai-suggest.js';
import { commitCommand } from './commit.js';
import chalk from 'chalk';

// Mock des dépendances
vi.mock('./commit.js');
vi.mock('chalk', () => ({
  default: {
    yellow: vi.fn((str: string) => str),
    dim: vi.fn((str: string) => str),
    cyan: vi.fn((str: string) => str),
    bold: vi.fn((str: string) => str),
  },
}));

describe('aiSuggestCommand', () => {
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should display deprecation warning', async () => {
    vi.mocked(commitCommand).mockResolvedValue(undefined);

    const promise = aiSuggestCommand();
    
    // Avancer les timers pour déclencher le setTimeout
    await vi.runOnlyPendingTimersAsync();
    
    await promise;

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('DÉPRÉCIATION')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('obsolète')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('gortex commit')
    );
  });

  it('should redirect to commitCommand after delay', async () => {
    vi.mocked(commitCommand).mockResolvedValue(undefined);

    const promise = aiSuggestCommand();
    
    // Avancer les timers pour déclencher le setTimeout
    await vi.runOnlyPendingTimersAsync();
    
    await promise;

    expect(commitCommand).toHaveBeenCalled();
  });

  it('should wait approximately 2 seconds before redirecting', async () => {
    vi.mocked(commitCommand).mockResolvedValue(undefined);

    const promise = aiSuggestCommand();
    
    // Vérifier que commitCommand n'est pas encore appelé avant le délai
    expect(commitCommand).not.toHaveBeenCalled();
    
    // Avancer les timers de 2000ms pour déclencher le setTimeout
    vi.advanceTimersByTime(2000);
    
    await promise;

    // Vérifier que commitCommand a été appelé après le délai
    expect(commitCommand).toHaveBeenCalledTimes(1);
  });

  it('should call commitCommand after showing warning', async () => {
    vi.mocked(commitCommand).mockResolvedValue(undefined);

    const promise = aiSuggestCommand();
    
    // Avancer les timers pour déclencher le setTimeout
    await vi.runOnlyPendingTimersAsync();
    
    await promise;

    expect(commitCommand).toHaveBeenCalledTimes(1);
  });

  it('should handle errors from commitCommand', async () => {
    const error = new Error('Commit command error');
    vi.mocked(commitCommand).mockRejectedValue(error);

    const promise = aiSuggestCommand();
    
    // Avancer les timers de 2000ms pour déclencher le setTimeout
    vi.advanceTimersByTime(2000);
    
    // Attendre que la promesse soit rejetée et vérifier l'erreur
    await expect(promise).rejects.toThrow('Commit command error');
  });
});

