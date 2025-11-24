/**
 * Factory for creating AST Diff Analyzer instances
 * Handles instantiation of AST analyzer implementations
 */

import type { IASTDiffAnalyzer } from "../../domain/services/ASTDiffAnalyzer.js";
import { TreeSitterASTDiffAnalyzer } from "../services/ast/TreeSitterASTDiffAnalyzer.js";

/**
 * Factory for creating AST diff analyzers
 */
export class ASTAnalyzerFactory {
  /**
   * Creates an AST diff analyzer instance
   * Attempts to create Tree-Sitter analyzer, falls back gracefully if unavailable
   * @returns An instance implementing IASTDiffAnalyzer, or undefined if not available
   */
  static createASTDiffAnalyzer(): IASTDiffAnalyzer | undefined {
    try {
      const analyzer = new TreeSitterASTDiffAnalyzer();
      // Check if analyzer is actually available (Tree-Sitter loaded successfully)
      // We can't check directly, but if initialization didn't throw, it's likely available
      return analyzer;
    } catch (_error) {
      // Tree-Sitter not available, return undefined
      // DiffAnalyzer will work without AST analysis
      return undefined;
    }
  }

  /**
   * Creates an AST diff analyzer instance if Tree-Sitter is available
   * @returns An instance implementing IASTDiffAnalyzer if available, undefined otherwise
   */
  static createASTDiffAnalyzerIfAvailable(): IASTDiffAnalyzer | undefined {
    return ASTAnalyzerFactory.createASTDiffAnalyzer();
  }
}
