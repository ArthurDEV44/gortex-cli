/**
 * Value Object representing a commit subject line
 * Immutable and validated on creation
 */

import { COMMIT_LIMITS } from "../../shared/constants/limits.js";

export class CommitSubject {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Creates a new CommitSubject from a string value
   * @throws Error if the subject is invalid
   */
  static create(subject: string): CommitSubject {
    const trimmed = subject.trim();

    if (trimmed.length === 0) {
      throw new Error("Commit subject cannot be empty");
    }

    if (trimmed.length < 3) {
      throw new Error(
        `Commit subject too short (${trimmed.length} chars). Minimum 3 characters required.`,
      );
    }

    if (trimmed.length > COMMIT_LIMITS.MAX_SUBJECT_LENGTH) {
      throw new Error(
        `Commit subject too long (${trimmed.length} chars). Maximum ${COMMIT_LIMITS.MAX_SUBJECT_LENGTH} characters allowed.`,
      );
    }

    // Subject should start with lowercase
    if (trimmed[0] !== trimmed[0].toLowerCase()) {
      throw new Error("Commit subject should start with a lowercase letter");
    }

    // Subject should not end with a period
    if (trimmed.endsWith(".")) {
      throw new Error("Commit subject should not end with a period");
    }

    return new CommitSubject(trimmed);
  }

  /**
   * Gets the string value of this subject
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Gets the length of this subject
   */
  getLength(): number {
    return this.value.length;
  }

  /**
   * Checks if this subject equals another
   */
  equals(other: CommitSubject): boolean {
    return this.value === other.value;
  }

  /**
   * Returns the string representation
   */
  toString(): string {
    return this.value;
  }
}
