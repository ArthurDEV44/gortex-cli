import { describe, it, expect, beforeEach } from 'vitest';
import { DIContainer, ServiceLifetime } from '../DIContainer.js';

// Test classes
class TestService {
  constructor(public value: string = 'test') {}
}

class DependentService {
  constructor(public dependency: TestService) {}
}

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  describe('register', () => {
    it('should register a service with string identifier', () => {
      container.register('test', () => new TestService());

      expect(container.isRegistered('test')).toBe(true);
    });

    it('should register a service with class identifier', () => {
      container.register(TestService, () => new TestService());

      expect(container.isRegistered(TestService)).toBe(true);
    });

    it('should allow chaining', () => {
      const result = container
        .register('service1', () => new TestService())
        .register('service2', () => new TestService());

      expect(result).toBe(container);
      expect(container.isRegistered('service1')).toBe(true);
      expect(container.isRegistered('service2')).toBe(true);
    });
  });

  describe('registerSingleton', () => {
    it('should register service as singleton', () => {
      container.registerSingleton('test', () => new TestService());

      const instance1 = container.resolve<TestService>('test');
      const instance2 = container.resolve<TestService>('test');

      expect(instance1).toBe(instance2);
    });

    it('should call factory only once for singleton', () => {
      let callCount = 0;
      container.registerSingleton('test', () => {
        callCount++;
        return new TestService();
      });

      container.resolve('test');
      container.resolve('test');
      container.resolve('test');

      expect(callCount).toBe(1);
    });
  });

  describe('registerTransient', () => {
    it('should register service as transient', () => {
      container.registerTransient('test', () => new TestService());

      const instance1 = container.resolve<TestService>('test');
      const instance2 = container.resolve<TestService>('test');

      expect(instance1).not.toBe(instance2);
    });

    it('should call factory on every resolve for transient', () => {
      let callCount = 0;
      container.registerTransient('test', () => {
        callCount++;
        return new TestService();
      });

      container.resolve('test');
      container.resolve('test');
      container.resolve('test');

      expect(callCount).toBe(3);
    });
  });

  describe('registerInstance', () => {
    it('should register an existing instance', () => {
      const instance = new TestService('existing');
      container.registerInstance('test', instance);

      const resolved = container.resolve<TestService>('test');

      expect(resolved).toBe(instance);
      expect(resolved.value).toBe('existing');
    });

    it('should always return the same instance', () => {
      const instance = new TestService('existing');
      container.registerInstance('test', instance);

      const resolved1 = container.resolve<TestService>('test');
      const resolved2 = container.resolve<TestService>('test');

      expect(resolved1).toBe(instance);
      expect(resolved2).toBe(instance);
    });
  });

  describe('resolve', () => {
    it('should resolve a registered service', () => {
      container.register('test', () => new TestService('resolved'));

      const service = container.resolve<TestService>('test');

      expect(service).toBeInstanceOf(TestService);
      expect(service.value).toBe('resolved');
    });

    it('should throw error for unregistered service', () => {
      expect(() => container.resolve('unknown')).toThrow('Service not registered: unknown');
    });

    it('should resolve dependencies via container', () => {
      container.registerSingleton(TestService, () => new TestService('dependency'));
      container.register(DependentService, c => new DependentService(c.resolve(TestService)));

      const service = container.resolve(DependentService);

      expect(service).toBeInstanceOf(DependentService);
      expect(service.dependency).toBeInstanceOf(TestService);
      expect(service.dependency.value).toBe('dependency');
    });

    it('should support nested dependency resolution', () => {
      container.registerSingleton('level1', () => ({ value: 'L1' }));
      container.registerSingleton('level2', c => ({
        value: 'L2',
        dependency: c.resolve<{ value: string }>('level1'),
      }));
      container.register('level3', c => ({
        value: 'L3',
        dependency: c.resolve<{ value: string; dependency: any }>('level2'),
      }));

      const service = container.resolve<any>('level3');

      expect(service.value).toBe('L3');
      expect(service.dependency.value).toBe('L2');
      expect(service.dependency.dependency.value).toBe('L1');
    });
  });

  describe('isRegistered', () => {
    it('should return true for registered service', () => {
      container.register('test', () => new TestService());

      expect(container.isRegistered('test')).toBe(true);
    });

    it('should return false for unregistered service', () => {
      expect(container.isRegistered('unknown')).toBe(false);
    });

    it('should work with class identifiers', () => {
      container.register(TestService, () => new TestService());

      expect(container.isRegistered(TestService)).toBe(true);
    });
  });

  describe('tryResolve', () => {
    it('should return service if registered', () => {
      container.register('test', () => new TestService('found'));

      const service = container.tryResolve<TestService>('test');

      expect(service).toBeDefined();
      expect(service?.value).toBe('found');
    });

    it('should return undefined if not registered', () => {
      const service = container.tryResolve('unknown');

      expect(service).toBeUndefined();
    });

    it('should not throw error for unregistered service', () => {
      expect(() => container.tryResolve('unknown')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all registrations', () => {
      container.register('service1', () => new TestService());
      container.register('service2', () => new TestService());

      expect(container.size).toBe(2);

      container.clear();

      expect(container.size).toBe(0);
      expect(container.isRegistered('service1')).toBe(false);
      expect(container.isRegistered('service2')).toBe(false);
    });

    it('should allow re-registration after clear', () => {
      container.register('test', () => new TestService('v1'));
      container.clear();
      container.register('test', () => new TestService('v2'));

      const service = container.resolve<TestService>('test');

      expect(service.value).toBe('v2');
    });
  });

  describe('createChild', () => {
    it('should create child container with parent registrations', () => {
      container.register('parent', () => new TestService('parent'));

      const child = container.createChild();

      expect(child.isRegistered('parent')).toBe(true);
      const service = child.resolve<TestService>('parent');
      expect(service.value).toBe('parent');
    });

    it('should allow child to override parent services', () => {
      container.register('test', () => new TestService('parent'));

      const child = container.createChild();
      child.register('test', () => new TestService('child'));

      const parentService = container.resolve<TestService>('test');
      const childService = child.resolve<TestService>('test');

      expect(parentService.value).toBe('parent');
      expect(childService.value).toBe('child');
    });

    it('should not affect parent when child adds services', () => {
      const child = container.createChild();
      child.register('child-only', () => new TestService('child'));

      expect(child.isRegistered('child-only')).toBe(true);
      expect(container.isRegistered('child-only')).toBe(false);
    });

    it('should inherit singleton instances from parent', () => {
      container.registerSingleton('singleton', () => new TestService('shared'));
      const parentInstance = container.resolve<TestService>('singleton');

      const child = container.createChild();
      const childInstance = child.resolve<TestService>('singleton');

      // Child should get same instance since it was copied
      expect(childInstance).toBe(parentInstance);
    });
  });

  describe('size', () => {
    it('should return number of registered services', () => {
      expect(container.size).toBe(0);

      container.register('service1', () => new TestService());
      expect(container.size).toBe(1);

      container.register('service2', () => new TestService());
      expect(container.size).toBe(2);

      container.clear();
      expect(container.size).toBe(0);
    });
  });

  describe('ServiceLifetime', () => {
    it('should respect custom lifetime in register', () => {
      container.register('transient', () => new TestService(), ServiceLifetime.Transient);
      container.register('singleton', () => new TestService(), ServiceLifetime.Singleton);

      const t1 = container.resolve('transient');
      const t2 = container.resolve('transient');
      expect(t1).not.toBe(t2);

      const s1 = container.resolve('singleton');
      const s2 = container.resolve('singleton');
      expect(s1).toBe(s2);
    });
  });
});
