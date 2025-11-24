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
