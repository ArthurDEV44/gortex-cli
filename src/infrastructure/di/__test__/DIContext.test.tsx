import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { DIProvider, useDI, useCompositionRoot, useServices, useUseCase } from '../DIContext.js';
import { CompositionRoot } from '../CompositionRoot.js';
import type { ApplicationServices } from '../CompositionRoot.js';

// Mock CompositionRoot
vi.mock('../CompositionRoot.js', async () => {
  const actual = await vi.importActual('../CompositionRoot.js');
  return {
    ...actual,
    CompositionRoot: vi.fn(),
  };
});

describe('DIContext', () => {
  let mockCompositionRoot: any;
  let mockServices: ApplicationServices;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock services
    mockServices = {
      createCommitUseCase: { execute: vi.fn() } as any,
      generateAICommitUseCase: { execute: vi.fn() } as any,
      getRepositoryStatusUseCase: { execute: vi.fn() } as any,
      analyzeCommitHistoryUseCase: { execute: vi.fn() } as any,
      stageFilesUseCase: { execute: vi.fn() } as any,
      branchOperationsUseCase: { getAllBranches: vi.fn() } as any,
      pushOperationsUseCase: { checkRemote: vi.fn() } as any,
    };

    // Mock CompositionRoot instance
    mockCompositionRoot = {
      getServices: vi.fn(() => mockServices),
      getContainer: vi.fn(() => ({
        resolve: vi.fn(),
      })),
      dispose: vi.fn(),
    };

    // Mock CompositionRoot constructor
    (CompositionRoot as any).mockImplementation(() => mockCompositionRoot);
  });

  describe('DIProvider', () => {
    it('should create a new CompositionRoot when root is not provided', () => {
      (CompositionRoot as any).mockClear();
      
      const TestComponent = () => {
        const di = useDI();
        return <div>DI Available</div>;
      };

      render(
        <DIProvider>
          <TestComponent />
        </DIProvider>
      );

      expect(CompositionRoot).toHaveBeenCalled();
    });

    it('should use provided root instead of creating new one', () => {
      (CompositionRoot as any).mockClear();
      
      const providedRoot = mockCompositionRoot;
      const TestComponent = () => {
        const di = useDI();
        expect(di.root).toBe(providedRoot);
        return <div>DI Available</div>;
      };

      render(
        <DIProvider root={providedRoot}>
          <TestComponent />
        </DIProvider>
      );

      // Should not create a new root when root is provided
      expect(CompositionRoot).not.toHaveBeenCalled();
    });

    it('should pass options to CompositionRoot when creating new root', () => {
      (CompositionRoot as any).mockClear();
      
      const options = { aiConfig: { provider: 'ollama' } } as any;
      const TestComponent = () => {
        const di = useDI();
        return <div>DI Available</div>;
      };

      render(
        <DIProvider options={options}>
          <TestComponent />
        </DIProvider>
      );

      expect(CompositionRoot).toHaveBeenCalledWith(options);
    });

    it('should memoize composition root', () => {
      (CompositionRoot as any).mockClear();
      
      let firstRoot: any = null;
      let secondRoot: any = null;
      
      const TestComponent = ({ renderCount }: { renderCount: number }) => {
        const di = useDI();
        if (renderCount === 1) {
          firstRoot = di.root;
        } else if (renderCount === 2) {
          secondRoot = di.root;
        }
        return <div>DI Available</div>;
      };

      const { rerender } = render(
        <DIProvider>
          <TestComponent renderCount={1} />
        </DIProvider>
      );

      // Rerender with same props
      rerender(
        <DIProvider>
          <TestComponent renderCount={2} />
        </DIProvider>
      );

      // Should use the same root instance (memoized)
      expect(firstRoot).toBeDefined();
      expect(secondRoot).toBeDefined();
      expect(firstRoot).toBe(secondRoot);
    });

    it('should memoize services', () => {
      let servicesCallCount = 0;
      mockCompositionRoot.getServices = vi.fn(() => {
        servicesCallCount++;
        return mockServices;
      });

      const TestComponent = () => {
        const di = useDI();
        return <div>DI Available</div>;
      };

      const { rerender } = render(
        <DIProvider>
          <TestComponent />
        </DIProvider>
      );

      const firstCallCount = servicesCallCount;

      rerender(
        <DIProvider>
          <TestComponent />
        </DIProvider>
      );

      // Should not call getServices again on rerender
      expect(servicesCallCount).toBe(firstCallCount);
    });
  });

  describe('useDI', () => {
    it('should return DI context value when used within DIProvider', () => {
      const TestComponent = () => {
        const di = useDI();
        expect(di.root).toBeDefined();
        expect(di.services).toBeDefined();
        return <div>DI Available</div>;
      };

      render(
        <DIProvider>
          <TestComponent />
        </DIProvider>
      );
    });

    it('should throw error when used outside DIProvider', () => {
      const TestComponent = () => {
        try {
          useDI();
          return <div>Should not render</div>;
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('useDI must be used within a DIProvider');
          return <div>Error caught</div>;
        }
      };

      // Suppress console.error for this test
      const consoleError = console.error;
      console.error = vi.fn();

      render(<TestComponent />);

      console.error = consoleError;
    });
  });

  describe('useCompositionRoot', () => {
    it('should return composition root', () => {
      const TestComponent = () => {
        const root = useCompositionRoot();
        expect(root).toBe(mockCompositionRoot);
        return <div>Root Available</div>;
      };

      render(
        <DIProvider>
          <TestComponent />
        </DIProvider>
      );
    });
  });

  describe('useServices', () => {
    it('should return all application services', () => {
      const TestComponent = () => {
        const services = useServices();
        expect(services).toBe(mockServices);
        expect(services.createCommitUseCase).toBeDefined();
        expect(services.generateAICommitUseCase).toBeDefined();
        expect(services.getRepositoryStatusUseCase).toBeDefined();
        expect(services.analyzeCommitHistoryUseCase).toBeDefined();
        expect(services.stageFilesUseCase).toBeDefined();
        expect(services.branchOperationsUseCase).toBeDefined();
        expect(services.pushOperationsUseCase).toBeDefined();
        return <div>Services Available</div>;
      };

      render(
        <DIProvider>
          <TestComponent />
        </DIProvider>
      );
    });
  });

  describe('useUseCase', () => {
    it('should return specific use case by name', () => {
      const TestComponent = () => {
        const useCase = useUseCase<typeof mockServices.createCommitUseCase>('createCommitUseCase');
        expect(useCase).toBe(mockServices.createCommitUseCase);
        return <div>Use Case Available</div>;
      };

      render(
        <DIProvider>
          <TestComponent />
        </DIProvider>
      );
    });

    it('should return different use case when name changes', () => {
      const TestComponent = ({ useCaseName }: { useCaseName: keyof ApplicationServices }) => {
        const useCase = useUseCase(useCaseName);
        if (useCaseName === 'createCommitUseCase') {
          expect(useCase).toBe(mockServices.createCommitUseCase);
        } else if (useCaseName === 'generateAICommitUseCase') {
          expect(useCase).toBe(mockServices.generateAICommitUseCase);
        }
        return <div>Use Case Available</div>;
      };

      const { rerender } = render(
        <DIProvider>
          <TestComponent useCaseName="createCommitUseCase" />
        </DIProvider>
      );

      rerender(
        <DIProvider>
          <TestComponent useCaseName="generateAICommitUseCase" />
        </DIProvider>
      );
    });

    it('should work with all use case names', () => {
      const useCaseNames: Array<keyof ApplicationServices> = [
        'createCommitUseCase',
        'generateAICommitUseCase',
        'getRepositoryStatusUseCase',
        'analyzeCommitHistoryUseCase',
        'stageFilesUseCase',
        'branchOperationsUseCase',
        'pushOperationsUseCase',
      ];

      useCaseNames.forEach((name) => {
        const TestComponent = () => {
          const useCase = useUseCase(name);
          expect(useCase).toBe(mockServices[name]);
          return <div>Use Case Available</div>;
        };

        render(
          <DIProvider>
            <TestComponent />
          </DIProvider>
        );
      });
    });
  });
});

