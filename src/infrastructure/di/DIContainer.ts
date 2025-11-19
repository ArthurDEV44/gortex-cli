/**
 * Dependency Injection Container
 * Provides type-safe dependency registration and resolution
 */

/**
 * Service lifetime strategies
 */
export enum ServiceLifetime {
  /** New instance created on every resolve */
  Transient = 'transient',
  /** Single instance shared across all resolves */
  Singleton = 'singleton',
}

/**
 * Factory function for creating service instances
 */
export type ServiceFactory<T> = (container: DIContainer) => T;

/**
 * Service registration descriptor
 */
interface ServiceDescriptor<T> {
  factory: ServiceFactory<T>;
  lifetime: ServiceLifetime;
  instance?: T;
}

/**
 * Service identifier (can be a string key or a class constructor)
 */
export type ServiceIdentifier<T> = string | (new (...args: any[]) => T);

/**
 * Dependency Injection Container
 * Manages service registration, resolution, and lifecycle
 */
export class DIContainer {
  private services = new Map<string, ServiceDescriptor<any>>();

  /**
   * Registers a service in the container
   * @param identifier Service identifier (string or constructor)
   * @param factory Factory function to create the service
   * @param lifetime Service lifetime (default: Transient)
   */
  register<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>,
    lifetime: ServiceLifetime = ServiceLifetime.Transient,
  ): this {
    const key = this.getKey(identifier);

    this.services.set(key, {
      factory,
      lifetime,
    });

    return this;
  }

  /**
   * Registers a singleton service
   * @param identifier Service identifier
   * @param factory Factory function to create the service
   */
  registerSingleton<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>,
  ): this {
    return this.register(identifier, factory, ServiceLifetime.Singleton);
  }

  /**
   * Registers a transient service
   * @param identifier Service identifier
   * @param factory Factory function to create the service
   */
  registerTransient<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>,
  ): this {
    return this.register(identifier, factory, ServiceLifetime.Transient);
  }

  /**
   * Registers an existing instance as a singleton
   * @param identifier Service identifier
   * @param instance Service instance
   */
  registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): this {
    const key = this.getKey(identifier);

    this.services.set(key, {
      factory: () => instance,
      lifetime: ServiceLifetime.Singleton,
      instance,
    });

    return this;
  }

  /**
   * Resolves a service from the container
   * @param identifier Service identifier
   * @returns Service instance
   * @throws Error if service is not registered
   */
  resolve<T>(identifier: ServiceIdentifier<T>): T {
    const key = this.getKey(identifier);
    const descriptor = this.services.get(key);

    if (!descriptor) {
      throw new Error(`Service not registered: ${key}`);
    }

    // Return existing singleton instance
    if (descriptor.lifetime === ServiceLifetime.Singleton && descriptor.instance) {
      return descriptor.instance;
    }

    // Create new instance
    const instance = descriptor.factory(this);

    // Cache singleton instance
    if (descriptor.lifetime === ServiceLifetime.Singleton) {
      descriptor.instance = instance;
    }

    return instance;
  }

  /**
   * Checks if a service is registered
   * @param identifier Service identifier
   * @returns True if service is registered
   */
  isRegistered<T>(identifier: ServiceIdentifier<T>): boolean {
    const key = this.getKey(identifier);
    return this.services.has(key);
  }

  /**
   * Tries to resolve a service, returns undefined if not registered
   * @param identifier Service identifier
   * @returns Service instance or undefined
   */
  tryResolve<T>(identifier: ServiceIdentifier<T>): T | undefined {
    try {
      return this.resolve(identifier);
    } catch {
      return undefined;
    }
  }

  /**
   * Clears all service registrations
   * Useful for testing
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Creates a child container that inherits parent registrations
   * Child can override parent services without affecting parent
   * @returns New child container
   */
  createChild(): DIContainer {
    const child = new DIContainer();

    // Copy parent registrations to child
    this.services.forEach((descriptor, key) => {
      child.services.set(key, { ...descriptor });
    });

    return child;
  }

  /**
   * Gets the number of registered services
   */
  get size(): number {
    return this.services.size;
  }

  /**
   * Converts service identifier to string key
   */
  private getKey<T>(identifier: ServiceIdentifier<T>): string {
    if (typeof identifier === 'string') {
      return identifier;
    }
    return identifier.name;
  }
}

/**
 * Default global container instance
 */
export const defaultContainer = new DIContainer();
