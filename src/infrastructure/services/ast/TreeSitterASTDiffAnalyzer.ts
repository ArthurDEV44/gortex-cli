/**
 * Infrastructure Service: Tree-Sitter based AST diff analyzer
 * Implements IASTDiffAnalyzer using Tree-Sitter for precise AST-based analysis
 *
 * COVERAGE NOTE: This file is excluded from coverage reporting due to tree-sitter's
 * native C++ bindings which cannot be instrumented by JavaScript coverage tools.
 * The code is fully tested (see __test__/TreeSitterASTDiffAnalyzer.test.ts) but
 * coverage metrics fail due to dynamic require() in native modules.
 * See: https://github.com/tree-sitter/tree-sitter/issues/4320
 */

import type {
  ASTAnalysis,
  IASTDiffAnalyzer,
  Refactoring,
  SemanticImpact,
  StructuralChange,
} from "../../../domain/services/ASTDiffAnalyzer.js";

/**
 * Tree-Sitter AST Diff Analyzer implementation
 * Requires: tree-sitter, tree-sitter-typescript, tree-sitter-javascript
 * Install with: pnpm add tree-sitter tree-sitter-typescript tree-sitter-javascript
 */
export class TreeSitterASTDiffAnalyzer implements IASTDiffAnalyzer {
  // biome-ignore lint/suspicious/noExplicitAny: tree-sitter doesn't provide TypeScript types
  private parser: any; // Parser from tree-sitter
  // biome-ignore lint/suspicious/noExplicitAny: tree-sitter doesn't provide TypeScript types
  private language: any; // Language from tree-sitter-typescript or tree-sitter-javascript
  private isAvailable: boolean = false;

  constructor() {
    this.initializeParser();
  }

  /**
   * Initialize Tree-Sitter parser
   * Gracefully handles missing dependencies
   */
  private initializeParser(): void {
    try {
      // Dynamic import to handle missing dependencies gracefully
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Parser = require("tree-sitter");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const TypeScript = require("tree-sitter-typescript");

      this.parser = new Parser.default();
      this.language = TypeScript.typescript;
      this.parser.setLanguage(this.language);
      this.isAvailable = true;
    } catch (_error) {
      // Tree-Sitter not available, fallback to line-based analysis
      this.isAvailable = false;
    }
  }

  supportsFile(filePath: string): boolean {
    if (!this.isAvailable) {
      return false;
    }

    const supportedExtensions = [".ts", ".tsx", ".js", ".jsx"];
    return supportedExtensions.some((ext) => filePath.endsWith(ext));
  }

  async analyzeFileAST(
    filePath: string,
    oldContent: string,
    newContent: string,
  ): Promise<ASTAnalysis> {
    if (!this.isAvailable || !this.supportsFile(filePath)) {
      return {
        refactorings: [],
        structuralChanges: [],
        semanticImpact: [],
      };
    }

    try {
      const oldTree = this.parser.parse(oldContent);
      const newTree = this.parser.parse(newContent);

      const refactorings = this.detectRefactorings(oldTree, newTree, filePath);
      const structuralChanges = this.detectStructuralChanges(
        oldTree,
        newTree,
        filePath,
      );
      const semanticImpact = this.analyzeSemanticImpact(
        structuralChanges,
        filePath,
      );

      return {
        refactorings,
        structuralChanges,
        semanticImpact,
      };
    } catch (_error) {
      // If parsing fails, return empty analysis (fallback to line-based)
      return {
        refactorings: [],
        structuralChanges: [],
        semanticImpact: [],
      };
    }
  }

  /**
   * Detects refactorings between old and new AST
   */
  private detectRefactorings(
    // biome-ignore lint/suspicious/noExplicitAny: tree-sitter doesn't provide TypeScript types
    oldTree: any,
    // biome-ignore lint/suspicious/noExplicitAny: tree-sitter doesn't provide TypeScript types
    newTree: any,
    filePath: string,
  ): Refactoring[] {
    const refactorings: Refactoring[] = [];

    const oldFunctions = this.extractFunctions(oldTree);
    const newFunctions = this.extractFunctions(newTree);

    // Detect function renames
    for (const oldFunc of oldFunctions) {
      const renamed = newFunctions.find(
        (newFunc) =>
          newFunc.name !== oldFunc.name &&
          this.isSimilarBody(oldFunc.body, newFunc.body, 0.9),
      );

      if (renamed) {
        refactorings.push({
          type: "function_rename",
          from: oldFunc.name,
          to: renamed.name,
          confidence: 0.95,
          file: filePath,
          description: `Function renamed from ${oldFunc.name} to ${renamed.name}`,
        });
      }
    }

    // Detect method renames (similar logic for class methods)
    const oldMethods = this.extractMethods(oldTree);
    const newMethods = this.extractMethods(newTree);

    for (const oldMethod of oldMethods) {
      const renamed = newMethods.find(
        (newMethod) =>
          oldMethod.className === newMethod.className &&
          oldMethod.name !== newMethod.name &&
          this.isSimilarBody(oldMethod.body, newMethod.body, 0.9),
      );

      if (renamed) {
        refactorings.push({
          type: "method_rename",
          from: `${oldMethod.className}.${oldMethod.name}`,
          to: `${renamed.className}.${renamed.name}`,
          confidence: 0.9,
          file: filePath,
          description: `Method ${oldMethod.name} renamed to ${renamed.name} in ${oldMethod.className}`,
        });
      }
    }

    return refactorings;
  }

  /**
   * Detects structural changes (added/removed/modified nodes)
   */
  private detectStructuralChanges(
    // biome-ignore lint/suspicious/noExplicitAny: tree-sitter doesn't provide TypeScript types
    oldTree: any,
    // biome-ignore lint/suspicious/noExplicitAny: tree-sitter doesn't provide TypeScript types
    newTree: any,
    filePath: string,
  ): StructuralChange[] {
    const changes: StructuralChange[] = [];

    const oldNodes = this.extractAllNodes(oldTree);
    const newNodes = this.extractAllNodes(newTree);

    const oldNodeMap = new Map(oldNodes.map((n) => [n.name, n]));
    const newNodeMap = new Map(newNodes.map((n) => [n.name, n]));

    // Find added nodes
    for (const newNode of newNodes) {
      if (!oldNodeMap.has(newNode.name)) {
        changes.push({
          type: "added",
          nodeType: newNode.type,
          name: newNode.name,
          file: filePath,
          lineRange: newNode.lineRange,
          isPublicAPI: newNode.isPublic,
        });
      } else {
        // Check if modified
        const oldNode = oldNodeMap.get(newNode.name);
        if (oldNode && !this.isSimilarBody(oldNode.body, newNode.body, 0.95)) {
          changes.push({
            type: "modified",
            nodeType: newNode.type,
            name: newNode.name,
            file: filePath,
            lineRange: newNode.lineRange,
            isPublicAPI: newNode.isPublic,
          });
        }
      }
    }

    // Find removed nodes
    for (const oldNode of oldNodes) {
      if (!newNodeMap.has(oldNode.name)) {
        changes.push({
          type: "removed",
          nodeType: oldNode.type,
          name: oldNode.name,
          file: filePath,
          lineRange: oldNode.lineRange,
          isPublicAPI: oldNode.isPublic,
        });
      }
    }

    return changes;
  }

  /**
   * Analyzes semantic impact of structural changes
   */
  private analyzeSemanticImpact(
    structuralChanges: StructuralChange[],
    filePath: string,
  ): SemanticImpact[] {
    const impacts: SemanticImpact[] = [];

    const publicAPIChanges = structuralChanges.filter((c) => c.isPublicAPI);

    if (publicAPIChanges.length > 0) {
      const hasRemoved = publicAPIChanges.some((c) => c.type === "removed");
      const hasModified = publicAPIChanges.some((c) => c.type === "modified");

      if (hasRemoved) {
        impacts.push({
          type: "breaking_change",
          file: filePath,
          severity: "high",
          description: "Public API removed or modified",
        });
      } else if (hasModified) {
        impacts.push({
          type: "api_change",
          file: filePath,
          severity: "medium",
          description: "Public API modified",
        });
      }
    }

    return impacts;
  }

  /**
   * Extracts function nodes from AST
   */
  // biome-ignore lint/suspicious/noExplicitAny: tree-sitter doesn't provide TypeScript types
  private extractFunctions(tree: any): Array<{ name: string; body: string }> {
    const functions: Array<{ name: string; body: string }> = [];

    // biome-ignore lint/suspicious/noExplicitAny: tree-sitter doesn't provide TypeScript types
    const walk = (node: any) => {
      if (
        node.type === "function_declaration" ||
        node.type === "arrow_function" ||
        node.type === "function_expression"
      ) {
        const nameNode = node.childForFieldName("name");
        const bodyNode = node.childForFieldName("body");

        if (nameNode && bodyNode) {
          functions.push({
            name: nameNode.text,
            body: bodyNode.text,
          });
        }
      }

      for (const child of node.children || []) {
        walk(child);
      }
    };

    walk(tree.rootNode);
    return functions;
  }

  /**
   * Extracts method nodes from AST
   */
  private extractMethods(
    // biome-ignore lint/suspicious/noExplicitAny: tree-sitter doesn't provide TypeScript types
    tree: any,
  ): Array<{ name: string; className: string; body: string }> {
    const methods: Array<{ name: string; className: string; body: string }> =
      [];

    // biome-ignore lint/suspicious/noExplicitAny: tree-sitter doesn't provide TypeScript types
    const walk = (node: any, className?: string) => {
      if (node.type === "class_declaration") {
        const nameNode = node.childForFieldName("name");
        const newClassName = nameNode ? nameNode.text : className;

        for (const child of node.children || []) {
          if (child.type === "method_definition") {
            const methodNameNode = child.childForFieldName("name");
            const bodyNode = child.childForFieldName("body");

            if (methodNameNode && bodyNode && newClassName) {
              methods.push({
                name: methodNameNode.text,
                className: newClassName,
                body: bodyNode.text,
              });
            }
          }
        }

        for (const child of node.children || []) {
          walk(child, newClassName);
        }
      } else {
        for (const child of node.children || []) {
          walk(child, className);
        }
      }
    };

    walk(tree.rootNode);
    return methods;
  }

  /**
   * Extracts all significant nodes from AST
   */
  // biome-ignore lint/suspicious/noExplicitAny: tree-sitter doesn't provide TypeScript types
  private extractAllNodes(tree: any): Array<{
    name: string;
    type: string;
    body: string;
    lineRange?: [number, number];
    isPublic: boolean;
  }> {
    const nodes: Array<{
      name: string;
      type: string;
      body: string;
      lineRange?: [number, number];
      isPublic: boolean;
    }> = [];

    // biome-ignore lint/suspicious/noExplicitAny: tree-sitter doesn't provide TypeScript types
    const walk = (node: any) => {
      const significantTypes = [
        "function_declaration",
        "class_declaration",
        "interface_declaration",
        "type_alias_declaration",
        "method_definition",
      ];

      if (significantTypes.includes(node.type)) {
        const nameNode = node.childForFieldName("name");
        const bodyNode = node.childForFieldName("body");

        if (nameNode) {
          const isPublic =
            !node.previousSibling ||
            (!node.previousSibling.text.includes("private") &&
              !node.previousSibling.text.includes("protected"));

          nodes.push({
            name: nameNode.text,
            type: node.type,
            body: bodyNode ? bodyNode.text : "",
            lineRange: [node.startPosition.row, node.endPosition.row],
            isPublic,
          });
        }
      }

      for (const child of node.children || []) {
        walk(child);
      }
    };

    walk(tree.rootNode);
    return nodes;
  }

  /**
   * Compares similarity of two code bodies using Levenshtein distance
   */
  private isSimilarBody(
    body1: string,
    body2: string,
    threshold: number,
  ): boolean {
    if (!body1 || !body2) {
      return false;
    }

    const distance = this.levenshteinDistance(body1, body2);
    const maxLen = Math.max(body1.length, body2.length);
    if (maxLen === 0) {
      return true;
    }

    const similarity = 1 - distance / maxLen;
    return similarity >= threshold;
  }

  /**
   * Calculates Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + 1,
          );
        }
      }
    }

    return matrix[len1][len2];
  }
}
