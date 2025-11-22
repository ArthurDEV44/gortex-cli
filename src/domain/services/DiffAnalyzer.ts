/**
 * Domain Service: Analyzes Git diffs to extract meaningful metadata
 * This service provides structured analysis of diffs to guide AI generation
 */

export interface ModifiedSymbol {
  file: string;
  name: string;
  type: "function" | "class" | "interface" | "type" | "const" | "method";
  lineRange?: [number, number];
}

export interface ChangePattern {
  type:
    | "test_addition"
    | "test_modification"
    | "bug_fix"
    | "refactoring"
    | "feature_addition"
    | "documentation"
    | "configuration"
    | "dependency_update"
    | "error_handling"
    | "type_definition"
    | "performance";
  description: string;
  count: number;
  confidence: number; // 0-1
}

export interface FileRelationship {
  from: string;
  to: string;
  type: "import" | "reference";
}

export interface FileChange {
  path: string;
  linesAdded: number;
  linesRemoved: number;
  importance: "high" | "medium" | "low";
  isNew: boolean;
  changeType: "created" | "modified" | "deleted";
}

export interface DiffAnalysis {
  modifiedSymbols: ModifiedSymbol[];
  changePatterns: ChangePattern[];
  fileRelationships: FileRelationship[];
  fileChanges: FileChange[]; // Detailed per-file analysis
  complexity: "simple" | "moderate" | "complex";
  summary: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    totalChanges: number;
  };
}

export class DiffAnalyzer {
  /**
   * Analyzes a git diff and extracts structured metadata
   */
  analyze(diff: string, stagedFiles: string[]): DiffAnalysis {
    const modifiedSymbols = this.extractModifiedSymbols(diff);
    const changePatterns = this.detectChangePatterns(diff, stagedFiles);
    const fileRelationships = this.extractFileRelationships(diff);
    const fileChanges = this.analyzeFileChanges(diff, stagedFiles);
    const summary = this.calculateSummary(diff);
    const complexity = this.assessComplexity(summary, modifiedSymbols.length);

    return {
      modifiedSymbols,
      changePatterns,
      fileRelationships,
      fileChanges,
      complexity,
      summary,
    };
  }

  /**
   * Extracts modified functions, classes, and other symbols from diff
   */
  private extractModifiedSymbols(diff: string): ModifiedSymbol[] {
    const symbols: ModifiedSymbol[] = [];
    const lines = diff.split("\n");
    let currentFile = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Track current file
      if (line.startsWith("diff --git")) {
        const match = line.match(/diff --git a\/(.+?) b\//);
        currentFile = match ? match[1] : "";
        continue;
      }

      // Skip if no file context
      if (!currentFile) continue;

      // Skip test files - we want symbols from source code, not tests
      if (
        currentFile.includes("test") ||
        currentFile.includes("spec") ||
        currentFile.includes("__tests__")
      ) {
        continue;
      }

      // Only analyze added/modified lines (lines starting with +)
      if (!line.startsWith("+")) continue;

      // Remove the + prefix for parsing
      const cleanLine = line.substring(1).trim();

      // Extract function declarations
      const funcMatch = this.matchFunction(cleanLine);
      if (funcMatch) {
        symbols.push({
          file: currentFile,
          name: funcMatch.name,
          type: funcMatch.type,
        });
        continue;
      }

      // Extract class declarations
      const classMatch = this.matchClass(cleanLine);
      if (classMatch) {
        symbols.push({
          file: currentFile,
          name: classMatch.name,
          type: classMatch.type,
        });
        continue;
      }

      // Extract type/interface declarations
      const typeMatch = this.matchType(cleanLine);
      if (typeMatch) {
        symbols.push({
          file: currentFile,
          name: typeMatch.name,
          type: typeMatch.type,
        });
        continue;
      }

      // Extract const/variable declarations
      const constMatch = this.matchConst(cleanLine);
      if (constMatch) {
        symbols.push({
          file: currentFile,
          name: constMatch.name,
          type: "const",
        });
      }
    }

    // Remove duplicates
    return this.deduplicateSymbols(symbols);
  }

  /**
   * Matches function declarations in various languages
   */
  private matchFunction(
    line: string,
  ): { name: string; type: "function" | "method" } | null {
    // TypeScript/JavaScript function
    // function foo(), const foo = (), async function foo(), export function foo()
    const tsFuncPattern =
      /(?:export\s+)?(?:async\s+)?(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*(?:=\s*(?:async\s+)?\(|=\s*(?:async\s+)?function|\()/;
    const tsFuncMatch = line.match(tsFuncPattern);
    if (tsFuncMatch) {
      return { name: tsFuncMatch[1], type: "function" };
    }

    // Arrow functions: const foo = () =>
    const arrowPattern =
      /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/;
    const arrowMatch = line.match(arrowPattern);
    if (arrowMatch) {
      return { name: arrowMatch[1], type: "function" };
    }

    // Method declarations: foo() {, async foo() {, private foo() {
    const methodPattern =
      /(?:public|private|protected|static|async)?\s*(\w+)\s*\([^)]*\)\s*[:{]/;
    const methodMatch = line.match(methodPattern);
    if (methodMatch && !line.includes("if") && !line.includes("while")) {
      return { name: methodMatch[1], type: "method" };
    }

    // Python function: def foo(
    const pyFuncPattern = /def\s+(\w+)\s*\(/;
    const pyFuncMatch = line.match(pyFuncPattern);
    if (pyFuncMatch) {
      return { name: pyFuncMatch[1], type: "function" };
    }

    // Go function: func foo(
    const goFuncPattern = /func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(/;
    const goFuncMatch = line.match(goFuncPattern);
    if (goFuncMatch) {
      return { name: goFuncMatch[1], type: "function" };
    }

    return null;
  }

  /**
   * Matches class declarations
   */
  private matchClass(line: string): { name: string; type: "class" } | null {
    // TypeScript/JavaScript/Python class
    const classPattern = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/;
    const match = line.match(classPattern);
    if (match) {
      return { name: match[1], type: "class" };
    }

    // Go struct
    const structPattern = /type\s+(\w+)\s+struct/;
    const structMatch = line.match(structPattern);
    if (structMatch) {
      return { name: structMatch[1], type: "class" };
    }

    return null;
  }

  /**
   * Matches type/interface declarations
   */
  private matchType(
    line: string,
  ): { name: string; type: "interface" | "type" } | null {
    // TypeScript interface
    const interfacePattern = /(?:export\s+)?interface\s+(\w+)/;
    const interfaceMatch = line.match(interfacePattern);
    if (interfaceMatch) {
      return { name: interfaceMatch[1], type: "interface" };
    }

    // TypeScript type alias
    const typePattern = /(?:export\s+)?type\s+(\w+)\s*=/;
    const typeMatch = line.match(typePattern);
    if (typeMatch) {
      return { name: typeMatch[1], type: "type" };
    }

    return null;
  }

  /**
   * Matches constant declarations
   */
  private matchConst(line: string): { name: string } | null {
    // Only match exported or uppercase constants (likely important)
    const constPattern = /(?:export\s+)?const\s+([A-Z_][A-Z0-9_]*)\s*=/;
    const match = line.match(constPattern);
    if (match) {
      return { name: match[1] };
    }

    return null;
  }

  /**
   * Removes duplicate symbols
   */
  private deduplicateSymbols(symbols: ModifiedSymbol[]): ModifiedSymbol[] {
    const seen = new Set<string>();
    const unique: ModifiedSymbol[] = [];

    for (const symbol of symbols) {
      const key = `${symbol.file}:${symbol.name}:${symbol.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(symbol);
      }
    }

    return unique;
  }

  /**
   * Detects common change patterns in the diff
   */
  private detectChangePatterns(
    diff: string,
    stagedFiles: string[],
  ): ChangePattern[] {
    const patterns: ChangePattern[] = [];

    // Identify source code files vs test files
    const testFiles = stagedFiles.filter(
      (f) =>
        f.includes("test") ||
        f.includes("spec") ||
        f.includes("__tests__") ||
        f.endsWith(".test.ts") ||
        f.endsWith(".spec.ts"),
    );

    const sourceFiles = stagedFiles.filter(
      (f) =>
        !testFiles.includes(f) &&
        (f.endsWith(".ts") ||
          f.endsWith(".tsx") ||
          f.endsWith(".js") ||
          f.endsWith(".jsx") ||
          f.endsWith(".py") ||
          f.endsWith(".go") ||
          f.endsWith(".rs")),
    );

    // Test patterns - but lower confidence if there are significant source code changes
    if (testFiles.length > 0) {
      const testAdditions = (diff.match(/\+.*(?:it|test|describe)\(/g) || [])
        .length;
      // If there are more source files than test files, tests are likely supporting changes
      const isTestPrimary = testFiles.length >= sourceFiles.length;

      if (testAdditions > 0) {
        patterns.push({
          type: "test_addition",
          description: `Added ${testAdditions} test case${testAdditions > 1 ? "s" : ""}`,
          count: testAdditions,
          confidence: isTestPrimary ? 0.9 : 0.5, // Lower confidence if source changes dominate
        });
      } else {
        patterns.push({
          type: "test_modification",
          description: `Modified ${testFiles.length} test file${testFiles.length > 1 ? "s" : ""}`,
          count: testFiles.length,
          confidence: isTestPrimary ? 0.85 : 0.4,
        });
      }
    }

    // Bug fix patterns
    const bugFixIndicators = [
      /\+.*(?:fix|bug|issue|error|correct)/i,
      /-.*(?:broken|incorrect|wrong|buggy)/i,
    ];
    const bugFixCount = bugFixIndicators.reduce(
      (count, pattern) => count + (diff.match(pattern) || []).length,
      0,
    );
    if (bugFixCount > 2) {
      patterns.push({
        type: "bug_fix",
        description: "Bug fix with error handling improvements",
        count: bugFixCount,
        confidence: 0.7,
      });
    }

    // Error handling patterns
    const errorHandlingCount = (
      diff.match(/\+.*(try|catch|throw|error|Error|exception)/g) || []
    ).length;
    if (errorHandlingCount > 2) {
      patterns.push({
        type: "error_handling",
        description: "Enhanced error handling",
        count: errorHandlingCount,
        confidence: 0.8,
      });
    }

    // Documentation patterns
    const docFiles = stagedFiles.filter(
      (f) =>
        f.endsWith(".md") || f.includes("README") || f.includes("CHANGELOG"),
    );
    const codeFiles = stagedFiles.filter(
      (f) =>
        f.endsWith(".ts") ||
        f.endsWith(".tsx") ||
        f.endsWith(".js") ||
        f.endsWith(".jsx") ||
        f.endsWith(".py") ||
        f.endsWith(".go") ||
        f.endsWith(".rs") ||
        f.endsWith(".java"),
    );

    if (docFiles.length > 0) {
      // If there are code files, lower documentation pattern confidence
      // Documentation changes are often secondary to code changes
      const confidence = codeFiles.length > 0 ? 0.3 : 0.95;

      patterns.push({
        type: "documentation",
        description: `Updated documentation in ${docFiles.length} file${docFiles.length > 1 ? "s" : ""}`,
        count: docFiles.length,
        confidence,
      });
    }

    // Configuration patterns
    const configFiles = stagedFiles.filter(
      (f) =>
        f.endsWith(".json") ||
        f.endsWith(".yaml") ||
        f.endsWith(".yml") ||
        f.endsWith(".toml") ||
        f.includes("config"),
    );
    if (
      configFiles.length > 0 &&
      !stagedFiles.some((f) => f.includes("package"))
    ) {
      patterns.push({
        type: "configuration",
        description: `Modified configuration files`,
        count: configFiles.length,
        confidence: 0.9,
      });
    }

    // Dependency updates
    if (
      stagedFiles.some(
        (f) =>
          f.includes("package.json") ||
          f.includes("go.mod") ||
          f.includes("requirements.txt"),
      )
    ) {
      patterns.push({
        type: "dependency_update",
        description: "Updated dependencies",
        count: 1,
        confidence: 0.85,
      });
    }

    // Type definition patterns
    const typeDefCount = (diff.match(/\+.*(?:interface|type)\s+\w+/g) || [])
      .length;
    if (typeDefCount > 1) {
      patterns.push({
        type: "type_definition",
        description: `Added or modified ${typeDefCount} type definition${typeDefCount > 1 ? "s" : ""}`,
        count: typeDefCount,
        confidence: 0.85,
      });
    }

    // Refactoring patterns (moved code, renamed)
    const refactoringIndicators = (
      diff.match(/\+.*(?:refactor|rename|move|extract|split)/gi) || []
    ).length;
    if (refactoringIndicators > 0 || this.hasSignificantMovement(diff)) {
      patterns.push({
        type: "refactoring",
        description: "Code refactoring and restructuring",
        count: refactoringIndicators,
        confidence: 0.65,
      });
    }

    // Performance patterns
    const perfIndicators = (
      diff.match(/\+.*(?:performance|optimize|cache|lazy|memo)/gi) || []
    ).length;
    if (perfIndicators > 0) {
      patterns.push({
        type: "performance",
        description: "Performance optimization",
        count: perfIndicators,
        confidence: 0.7,
      });
    }

    // Feature addition - detect new classes/services/modules
    const newClassCount = (
      diff.match(/\+\s*(?:export\s+)?(?:class|interface)\s+\w+/g) || []
    ).length;
    const newFileCount = stagedFiles.filter((f) => {
      // Check if file appears to be new (many additions, few deletions in its section)
      const fileSection =
        diff.split(`diff --git a/${f}`)[1]?.split("diff --git")[0] || "";
      const adds = (fileSection.match(/^\+[^+]/gm) || []).length;
      const dels = (fileSection.match(/^-[^-]/gm) || []).length;
      return adds > 10 && dels < 5;
    }).length;

    if (
      newClassCount > 0 ||
      newFileCount > 0 ||
      sourceFiles.length > testFiles.length
    ) {
      const addedLines = (diff.match(/^\+[^+]/gm) || []).length;
      const removedLines = (diff.match(/^-[^-]/gm) || []).length;

      if (addedLines > removedLines * 1.5) {
        let description = "New functionality added";
        if (newClassCount > 0) {
          description = `New ${newClassCount} class${newClassCount > 1 ? "es" : ""} or service${newClassCount > 1 ? "s" : ""}`;
        } else if (newFileCount > 0) {
          description = `New ${newFileCount} file${newFileCount > 1 ? "s" : ""} with functionality`;
        }

        patterns.push({
          type: "feature_addition",
          description,
          count: addedLines,
          confidence: 0.8,
        });
      }
    }

    // Sort by confidence
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detects if there's significant code movement (refactoring indicator)
   */
  private hasSignificantMovement(diff: string): boolean {
    const lines = diff.split("\n");
    let identicalPairs = 0;

    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i].startsWith("-") && lines[i + 1].startsWith("+")) {
        const removed = lines[i].substring(1).trim();
        const added = lines[i + 1].substring(1).trim();
        // If lines are very similar, it's likely a move/refactor
        if (removed.length > 20 && this.similarity(removed, added) > 0.8) {
          identicalPairs++;
        }
      }
    }

    return identicalPairs > 3;
  }

  /**
   * Calculates similarity between two strings (simple Levenshtein-like)
   */
  private similarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (shorter[i] === longer[i]) matches++;
    }

    return matches / longer.length;
  }

  /**
   * Analyzes each file's changes to determine importance and change type
   */
  private analyzeFileChanges(
    diff: string,
    stagedFiles: string[],
  ): FileChange[] {
    const fileChanges: FileChange[] = [];

    // Deduplicate files (Git can sometimes list files multiple times)
    const uniqueFiles = Array.from(new Set(stagedFiles));

    for (const file of uniqueFiles) {
      // Extract the diff section for this file
      const fileSection = this.extractFileSection(diff, file);
      if (!fileSection) continue;

      const linesAdded = (fileSection.match(/^\+[^+]/gm) || []).length;
      const linesRemoved = (fileSection.match(/^-[^-]/gm) || []).length;
      const isNew = linesAdded > 10 && linesRemoved === 0;
      const isDeleted = linesRemoved > 10 && linesAdded === 0;

      // Determine importance based on:
      // 1. Source code files > test files > docs
      // 2. New files > heavily modified > lightly modified
      // 3. Core domain/service files > infrastructure > utils
      let importance: "high" | "medium" | "low" = "medium";

      const isSourceCode =
        !file.includes("test") &&
        !file.includes("spec") &&
        !file.endsWith(".md") &&
        (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js"));

      const isCoreDomain =
        file.includes("/domain/") ||
        file.includes("/services/") ||
        file.includes("/use-cases/");

      const totalChanges = linesAdded + linesRemoved;

      if (isNew && isSourceCode) {
        importance = "high";
      } else if (isCoreDomain && totalChanges > 20) {
        importance = "high";
      } else if (isSourceCode && totalChanges > 50) {
        importance = "high";
      } else if (file.endsWith(".md") || file.includes("test")) {
        importance = "low";
      }

      fileChanges.push({
        path: file,
        linesAdded,
        linesRemoved,
        importance,
        isNew,
        changeType: isDeleted ? "deleted" : isNew ? "created" : "modified",
      });
    }

    // Sort by importance (high first) then by total changes
    return fileChanges.sort((a, b) => {
      if (a.importance !== b.importance) {
        const importanceOrder = { high: 0, medium: 1, low: 2 };
        return importanceOrder[a.importance] - importanceOrder[b.importance];
      }
      return b.linesAdded + b.linesRemoved - (a.linesAdded + a.linesRemoved);
    });
  }

  /**
   * Extracts the diff section for a specific file
   */
  private extractFileSection(diff: string, filename: string): string | null {
    const startPattern = `diff --git a/${filename}`;
    const startIndex = diff.indexOf(startPattern);
    if (startIndex === -1) return null;

    const nextDiffIndex = diff.indexOf("diff --git", startIndex + 1);
    if (nextDiffIndex === -1) {
      return diff.substring(startIndex);
    }
    return diff.substring(startIndex, nextDiffIndex);
  }

  /**
   * Extracts file relationships (imports, references)
   */
  private extractFileRelationships(diff: string): FileRelationship[] {
    const relationships: FileRelationship[] = [];
    const lines = diff.split("\n");
    let currentFile = "";

    for (const line of lines) {
      // Track current file
      if (line.startsWith("diff --git")) {
        const match = line.match(/diff --git a\/(.+?) b\//);
        currentFile = match ? match[1] : "";
        continue;
      }

      if (!currentFile || !line.startsWith("+")) continue;

      // Extract import statements
      const importMatch = line.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        relationships.push({
          from: currentFile,
          to: importMatch[1],
          type: "import",
        });
        continue;
      }

      // Extract require statements
      const requireMatch = line.match(/require\s*\(['"]([^'"]+)['"]\)/);
      if (requireMatch) {
        relationships.push({
          from: currentFile,
          to: requireMatch[1],
          type: "import",
        });
      }
    }

    return relationships;
  }

  /**
   * Calculates diff summary statistics
   */
  private calculateSummary(diff: string): DiffAnalysis["summary"] {
    const lines = diff.split("\n");
    const files = new Set<string>();
    let linesAdded = 0;
    let linesRemoved = 0;

    for (const line of lines) {
      if (line.startsWith("diff --git")) {
        const match = line.match(/diff --git a\/(.+?) b\//);
        if (match) files.add(match[1]);
      } else if (line.startsWith("+") && !line.startsWith("+++")) {
        linesAdded++;
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        linesRemoved++;
      }
    }

    return {
      filesChanged: files.size,
      linesAdded,
      linesRemoved,
      totalChanges: linesAdded + linesRemoved,
    };
  }

  /**
   * Assesses complexity based on summary and symbols
   */
  private assessComplexity(
    summary: DiffAnalysis["summary"],
    symbolCount: number,
  ): "simple" | "moderate" | "complex" {
    // Simple: 1-2 files, few changes, few symbols
    if (
      summary.filesChanged <= 2 &&
      summary.totalChanges < 50 &&
      symbolCount <= 3
    ) {
      return "simple";
    }

    // Complex: many files, many changes, or many symbols
    if (
      summary.filesChanged > 5 ||
      summary.totalChanges > 200 ||
      symbolCount > 10
    ) {
      return "complex";
    }

    // Moderate: everything else
    return "moderate";
  }
}
