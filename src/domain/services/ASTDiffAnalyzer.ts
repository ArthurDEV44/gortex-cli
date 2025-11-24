/**
 * Domain Service: AST-based diff analysis interface
 * Defines the contract for AST-based code change analysis
 * Part of the Domain layer - contains no implementation details
 */

/**
 * Represents a refactoring detected in the code
 */
export interface Refactoring {
  type:
    | "function_rename"
    | "method_rename"
    | "class_rename"
    | "extract_method"
    | "inline_function"
    | "move_function"
    | "move_class"
    | "extract_class"
    | "merge_classes";
  from: string;
  to: string;
  confidence: number; // 0-1
  file: string;
  description?: string;
}

/**
 * Represents a structural change detected via AST
 */
export interface StructuralChange {
  type: "added" | "modified" | "removed";
  nodeType: string; // function, class, interface, etc.
  name: string;
  file: string;
  lineRange?: [number, number];
  isPublicAPI?: boolean;
}

/**
 * Represents semantic impact of changes
 */
export interface SemanticImpact {
  type: "api_change" | "breaking_change" | "dependency_change" | "type_change";
  file: string;
  severity: "low" | "medium" | "high";
  description?: string;
}

/**
 * Result of AST-based analysis
 */
export interface ASTAnalysis {
  refactorings: Refactoring[];
  structuralChanges: StructuralChange[];
  semanticImpact: SemanticImpact[];
}

/**
 * Interface for AST-based diff analysis
 * Implementations should use Tree-Sitter or similar AST parsers
 */
export interface IASTDiffAnalyzer {
  /**
   * Analyzes changes between old and new code using AST
   * @param filePath Path to the file being analyzed
   * @param oldContent Original code content
   * @param newContent New code content
   * @returns AST-based analysis of changes
   */
  analyzeFileAST(
    filePath: string,
    oldContent: string,
    newContent: string,
  ): Promise<ASTAnalysis>;

  /**
   * Checks if the analyzer supports the given file type
   * @param filePath Path to the file
   * @returns true if the file type is supported
   */
  supportsFile(filePath: string): boolean;
}

/**
 * Valid refactoring types
 */
const VALID_REFACTORING_TYPES = [
  "function_rename",
  "method_rename",
  "class_rename",
  "extract_method",
  "inline_function",
  "move_function",
  "move_class",
  "extract_class",
  "merge_classes",
] as const;

/**
 * Valid structural change types
 */
const VALID_STRUCTURAL_CHANGE_TYPES = ["added", "modified", "removed"] as const;

/**
 * Valid semantic impact types
 */
const VALID_SEMANTIC_IMPACT_TYPES = [
  "api_change",
  "breaking_change",
  "dependency_change",
  "type_change",
] as const;

/**
 * Valid severity levels
 */
const VALID_SEVERITY_LEVELS = ["low", "medium", "high"] as const;

/**
 * Validates a Refactoring object
 * @param refactoring The object to validate
 * @returns true if valid, false otherwise
 */
export function isValidRefactoring(
  refactoring: unknown,
): refactoring is Refactoring {
  if (!refactoring || typeof refactoring !== "object") {
    return false;
  }

  const r = refactoring as Record<string, unknown>;

  if (
    !VALID_REFACTORING_TYPES.includes(
      r.type as (typeof VALID_REFACTORING_TYPES)[number],
    )
  ) {
    return false;
  }

  if (typeof r.from !== "string") {
    return false;
  }

  if (typeof r.to !== "string") {
    return false;
  }

  if (
    typeof r.confidence !== "number" ||
    !Number.isFinite(r.confidence) ||
    r.confidence < 0 ||
    r.confidence > 1
  ) {
    return false;
  }

  if (typeof r.file !== "string") {
    return false;
  }

  if (r.description !== undefined && typeof r.description !== "string") {
    return false;
  }

  return true;
}

/**
 * Validates a StructuralChange object
 * @param change The object to validate
 * @returns true if valid, false otherwise
 */
export function isValidStructuralChange(
  change: unknown,
): change is StructuralChange {
  if (!change || typeof change !== "object") {
    return false;
  }

  const c = change as Record<string, unknown>;

  if (
    !VALID_STRUCTURAL_CHANGE_TYPES.includes(
      c.type as (typeof VALID_STRUCTURAL_CHANGE_TYPES)[number],
    )
  ) {
    return false;
  }

  if (typeof c.nodeType !== "string") {
    return false;
  }

  if (typeof c.name !== "string") {
    return false;
  }

  if (typeof c.file !== "string") {
    return false;
  }

  if (c.lineRange !== undefined) {
    if (
      !Array.isArray(c.lineRange) ||
      c.lineRange.length !== 2 ||
      typeof c.lineRange[0] !== "number" ||
      typeof c.lineRange[1] !== "number" ||
      !Number.isFinite(c.lineRange[0]) ||
      !Number.isFinite(c.lineRange[1])
    ) {
      return false;
    }
  }

  if (c.isPublicAPI !== undefined && typeof c.isPublicAPI !== "boolean") {
    return false;
  }

  return true;
}

/**
 * Validates a SemanticImpact object
 * @param impact The object to validate
 * @returns true if valid, false otherwise
 */
export function isValidSemanticImpact(
  impact: unknown,
): impact is SemanticImpact {
  if (!impact || typeof impact !== "object") {
    return false;
  }

  const i = impact as Record<string, unknown>;

  if (
    !VALID_SEMANTIC_IMPACT_TYPES.includes(
      i.type as (typeof VALID_SEMANTIC_IMPACT_TYPES)[number],
    )
  ) {
    return false;
  }

  if (typeof i.file !== "string") {
    return false;
  }

  if (
    !VALID_SEVERITY_LEVELS.includes(
      i.severity as (typeof VALID_SEVERITY_LEVELS)[number],
    )
  ) {
    return false;
  }

  if (i.description !== undefined && typeof i.description !== "string") {
    return false;
  }

  return true;
}

/**
 * Validates an ASTAnalysis object
 * @param analysis The object to validate
 * @returns true if valid, false otherwise
 */
export function isValidASTAnalysis(analysis: unknown): analysis is ASTAnalysis {
  if (!analysis || typeof analysis !== "object") {
    return false;
  }

  const a = analysis as Record<string, unknown>;

  if (!Array.isArray(a.refactorings)) {
    return false;
  }

  if (!a.refactorings.every((item: unknown) => isValidRefactoring(item))) {
    return false;
  }

  if (!Array.isArray(a.structuralChanges)) {
    return false;
  }

  if (
    !a.structuralChanges.every((item: unknown) => isValidStructuralChange(item))
  ) {
    return false;
  }

  if (!Array.isArray(a.semanticImpact)) {
    return false;
  }

  if (!a.semanticImpact.every((item: unknown) => isValidSemanticImpact(item))) {
    return false;
  }

  return true;
}

/**
 * Creates an empty ASTAnalysis object
 * @returns An empty ASTAnalysis with empty arrays
 */
export function createEmptyASTAnalysis(): ASTAnalysis {
  return {
    refactorings: [],
    structuralChanges: [],
    semanticImpact: [],
  };
}
