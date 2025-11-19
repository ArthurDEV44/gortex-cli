/**
 * React Context for Dependency Injection
 * Provides composition root to React components
 */

import React, { createContext, useContext, useMemo } from 'react';
import { CompositionRoot, type ApplicationServices } from './CompositionRoot.js';
import type { ServiceRegistrationOptions } from './ServiceRegistry.js';

/**
 * DI Context value
 */
interface DIContextValue {
  root: CompositionRoot;
  services: ApplicationServices;
}

/**
 * DI Context
 */
const DIContext = createContext<DIContextValue | null>(null);

/**
 * DI Provider Props
 */
interface DIProviderProps {
  children: React.ReactNode;
  options?: ServiceRegistrationOptions;
  root?: CompositionRoot;
}

/**
 * DI Provider Component
 * Provides dependency injection container to React tree
 */
export const DIProvider: React.FC<DIProviderProps> = ({ children, options, root: providedRoot }) => {
  // Create or use provided composition root
  const root = useMemo(() => {
    return providedRoot || new CompositionRoot(options);
  }, [providedRoot, options]);

  // Get services lazily
  const services = useMemo(() => root.getServices(), [root]);

  const value: DIContextValue = {
    root,
    services,
  };

  return <DIContext.Provider value={value}>{children}</DIContext.Provider>;
};

/**
 * Hook to access DI container
 * @throws Error if used outside DIProvider
 */
export function useDI(): DIContextValue {
  const context = useContext(DIContext);

  if (!context) {
    throw new Error('useDI must be used within a DIProvider');
  }

  return context;
}

/**
 * Hook to access composition root
 */
export function useCompositionRoot(): CompositionRoot {
  const { root } = useDI();
  return root;
}

/**
 * Hook to access all application services
 */
export function useServices(): ApplicationServices {
  const { services } = useDI();
  return services;
}

/**
 * Hook to access a specific use case
 */
export function useUseCase<T>(useCaseName: keyof ApplicationServices): T {
  const services = useServices();
  return services[useCaseName] as T;
}
