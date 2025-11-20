/**
 * Value Object representing a conventional commit type
 * Immutable and validated on creation
 */

import { getCommitTypeValues } from "../../shared/constants/commit-types.js";

export class CommitType {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Creates a new CommitType from a string value
   * @throws Error if the type is invalid
   */
  static create(type: string): CommitType {
    const validTypes = getCommitTypeValues();

    if (!validTypes.includes(type)) {
      throw new Error(
        `Invalid commit type: "${type}". Must be one of: ${validTypes.join(", ")}`,
      );
    }

    return new CommitType(type);
  }

  /**
   * Gets the string value of this commit type
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Checks if this commit type equals another
   */
  equals(other: CommitType): boolean {
    return this.value === other.value;
  }

  /**
   * Returns the string representation
   */
  toString(): string {
    return this.value;
  }
}
