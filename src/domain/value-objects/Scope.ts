/**
 * Value Object representing a commit scope
 * Immutable and validated on creation
 */

export class Scope {
  private constructor(private readonly value: string | undefined) {
    Object.freeze(this);
  }

  /**
   * Creates a new Scope from a string value
   * @throws Error if the scope is invalid (empty string or whitespace-only)
   */
  static create(scope?: string): Scope {
    // Undefined or null is valid (no scope)
    if (scope === undefined || scope === null) {
      return new Scope(undefined);
    }

    // Empty string or whitespace-only is invalid
    const trimmed = scope.trim();
    if (trimmed.length === 0) {
      throw new Error("Scope cannot be empty or whitespace-only");
    }

    // Validate format: lowercase alphanumeric with hyphens
    if (!/^[a-z0-9-]+$/.test(trimmed)) {
      throw new Error(
        "Scope must contain only lowercase letters, numbers, and hyphens",
      );
    }

    return new Scope(trimmed);
  }

  /**
   * Creates an empty scope (no scope)
   */
  static empty(): Scope {
    return new Scope(undefined);
  }

  /**
   * Gets the string value of this scope (undefined if no scope)
   */
  getValue(): string | undefined {
    return this.value;
  }

  /**
   * Checks if this scope is empty (has no value)
   */
  isEmpty(): boolean {
    return this.value === undefined;
  }

  /**
   * Checks if this scope equals another
   */
  equals(other: Scope): boolean {
    return this.value === other.value;
  }

  /**
   * Returns the string representation
   */
  toString(): string {
    return this.value ?? "";
  }
}
