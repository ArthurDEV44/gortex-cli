/**
 * Tests for ASTDiffAnalyzer domain interfaces
 * Tests the Refactoring, StructuralChange, SemanticImpact, ASTAnalysis structures
 * and IASTDiffAnalyzer contract
 */

import { describe, it, expect, vi } from "vitest";
import {
  type IASTDiffAnalyzer,
  type Refactoring,
  type StructuralChange,
  type SemanticImpact,
  type ASTAnalysis,
  isValidRefactoring,
  isValidStructuralChange,
  isValidSemanticImpact,
  isValidASTAnalysis,
  createEmptyASTAnalysis,
} from "../ASTDiffAnalyzer.js";

describe("ASTDiffAnalyzer Domain", () => {
  describe("Refactoring interface", () => {
    it("should accept valid refactoring objects", () => {
      const refactoring: Refactoring = {
        type: "function_rename",
        from: "oldFunction",
        to: "newFunction",
        confidence: 0.9,
        file: "src/file.ts",
        description: "Renamed function for clarity",
      };

      expect(refactoring.type).toBe("function_rename");
      expect(refactoring.from).toBe("oldFunction");
      expect(refactoring.to).toBe("newFunction");
      expect(refactoring.confidence).toBe(0.9);
      expect(refactoring.file).toBe("src/file.ts");
      expect(refactoring.description).toBe("Renamed function for clarity");
    });

    it("should accept all valid refactoring types", () => {
      const types = [
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

      types.forEach((type) => {
        const refactoring: Refactoring = {
          type,
          from: "old",
          to: "new",
          confidence: 0.5,
          file: "src/file.ts",
        };

        expect(refactoring.type).toBe(type);
      });
    });

    it("should accept refactoring without description", () => {
      const refactoring: Refactoring = {
        type: "function_rename",
        from: "old",
        to: "new",
        confidence: 0.8,
        file: "src/file.ts",
      };

      expect(refactoring.description).toBeUndefined();
    });

    it("should accept confidence at boundaries", () => {
      const minConfidence: Refactoring = {
        type: "function_rename",
        from: "old",
        to: "new",
        confidence: 0,
        file: "src/file.ts",
      };

      const maxConfidence: Refactoring = {
        type: "function_rename",
        from: "old",
        to: "new",
        confidence: 1,
        file: "src/file.ts",
      };

      expect(minConfidence.confidence).toBe(0);
      expect(maxConfidence.confidence).toBe(1);
    });
  });

  describe("StructuralChange interface", () => {
    it("should accept valid structural change objects", () => {
      const change: StructuralChange = {
        type: "added",
        nodeType: "function",
        name: "newFunction",
        file: "src/file.ts",
        lineRange: [10, 20],
        isPublicAPI: true,
      };

      expect(change.type).toBe("added");
      expect(change.nodeType).toBe("function");
      expect(change.name).toBe("newFunction");
      expect(change.file).toBe("src/file.ts");
      expect(change.lineRange).toEqual([10, 20]);
      expect(change.isPublicAPI).toBe(true);
    });

    it("should accept all valid structural change types", () => {
      const types = ["added", "modified", "removed"] as const;

      types.forEach((type) => {
        const change: StructuralChange = {
          type,
          nodeType: "function",
          name: "test",
          file: "src/file.ts",
        };

        expect(change.type).toBe(type);
      });
    });

    it("should accept structural change without optional properties", () => {
      const change: StructuralChange = {
        type: "modified",
        nodeType: "class",
        name: "TestClass",
        file: "src/file.ts",
      };

      expect(change.lineRange).toBeUndefined();
      expect(change.isPublicAPI).toBeUndefined();
    });

    it("should accept various node types", () => {
      const nodeTypes = ["function", "class", "interface", "method", "variable"];

      nodeTypes.forEach((nodeType) => {
        const change: StructuralChange = {
          type: "added",
          nodeType,
          name: "test",
          file: "src/file.ts",
        };

        expect(change.nodeType).toBe(nodeType);
      });
    });
  });

  describe("SemanticImpact interface", () => {
    it("should accept valid semantic impact objects", () => {
      const impact: SemanticImpact = {
        type: "breaking_change",
        file: "src/api.ts",
        severity: "high",
        description: "API signature changed",
      };

      expect(impact.type).toBe("breaking_change");
      expect(impact.file).toBe("src/api.ts");
      expect(impact.severity).toBe("high");
      expect(impact.description).toBe("API signature changed");
    });

    it("should accept all valid semantic impact types", () => {
      const types = [
        "api_change",
        "breaking_change",
        "dependency_change",
        "type_change",
      ] as const;

      types.forEach((type) => {
        const impact: SemanticImpact = {
          type,
          file: "src/file.ts",
          severity: "medium",
        };

        expect(impact.type).toBe(type);
      });
    });

    it("should accept all valid severity levels", () => {
      const severities = ["low", "medium", "high"] as const;

      severities.forEach((severity) => {
        const impact: SemanticImpact = {
          type: "api_change",
          file: "src/file.ts",
          severity,
        };

        expect(impact.severity).toBe(severity);
      });
    });

    it("should accept semantic impact without description", () => {
      const impact: SemanticImpact = {
        type: "type_change",
        file: "src/file.ts",
        severity: "low",
      };

      expect(impact.description).toBeUndefined();
    });
  });

  describe("ASTAnalysis interface", () => {
    it("should accept valid ASTAnalysis objects", () => {
      const analysis: ASTAnalysis = {
        refactorings: [
          {
            type: "function_rename",
            from: "old",
            to: "new",
            confidence: 0.9,
            file: "src/file.ts",
          },
        ],
        structuralChanges: [
          {
            type: "added",
            nodeType: "function",
            name: "newFunction",
            file: "src/file.ts",
          },
        ],
        semanticImpact: [
          {
            type: "breaking_change",
            file: "src/api.ts",
            severity: "high",
          },
        ],
      };

      expect(analysis.refactorings).toHaveLength(1);
      expect(analysis.structuralChanges).toHaveLength(1);
      expect(analysis.semanticImpact).toHaveLength(1);
    });

    it("should accept empty ASTAnalysis", () => {
      const analysis: ASTAnalysis = {
        refactorings: [],
        structuralChanges: [],
        semanticImpact: [],
      };

      expect(analysis.refactorings).toEqual([]);
      expect(analysis.structuralChanges).toEqual([]);
      expect(analysis.semanticImpact).toEqual([]);
    });
  });

  describe("IASTDiffAnalyzer interface", () => {
    it("should allow implementation with correct method signatures", async () => {
      const mockAnalyzer: IASTDiffAnalyzer = {
        analyzeFileAST: vi.fn().mockResolvedValue({
          refactorings: [],
          structuralChanges: [],
          semanticImpact: [],
        }),
        supportsFile: vi.fn().mockReturnValue(true),
      };

      const result = await mockAnalyzer.analyzeFileAST(
        "src/file.ts",
        "old code",
        "new code",
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result.refactorings)).toBe(true);
      expect(Array.isArray(result.structuralChanges)).toBe(true);
      expect(Array.isArray(result.semanticImpact)).toBe(true);
      expect(mockAnalyzer.analyzeFileAST).toHaveBeenCalledWith(
        "src/file.ts",
        "old code",
        "new code",
      );
    });

    it("should allow supportsFile to return boolean", () => {
      const mockAnalyzer: IASTDiffAnalyzer = {
        analyzeFileAST: vi.fn(),
        supportsFile: vi.fn().mockReturnValue(false),
      };

      const result = mockAnalyzer.supportsFile("src/file.ts");

      expect(typeof result).toBe("boolean");
      expect(mockAnalyzer.supportsFile).toHaveBeenCalledWith("src/file.ts");
    });

    it("should handle async analyzeFileAST correctly", async () => {
      const mockAnalysis: ASTAnalysis = {
        refactorings: [
          {
            type: "function_rename",
            from: "old",
            to: "new",
            confidence: 0.8,
            file: "src/file.ts",
          },
        ],
        structuralChanges: [],
        semanticImpact: [],
      };

      const mockAnalyzer: IASTDiffAnalyzer = {
        analyzeFileAST: vi.fn().mockResolvedValue(mockAnalysis),
        supportsFile: vi.fn().mockReturnValue(true),
      };

      const result = await mockAnalyzer.analyzeFileAST(
        "test.ts",
        "const x = 1;",
        "const y = 2;",
      );

      expect(result).toEqual(mockAnalysis);
      expect(mockAnalyzer.analyzeFileAST).toHaveBeenCalledTimes(1);
    });
  });

  describe("isValidRefactoring", () => {
    it("should return true for valid refactoring objects", () => {
      const validRefactoring: Refactoring = {
        type: "function_rename",
        from: "oldFunction",
        to: "newFunction",
        confidence: 0.9,
        file: "src/file.ts",
        description: "Optional description",
      };

      expect(isValidRefactoring(validRefactoring)).toBe(true);
    });

    it("should return true for refactoring without description", () => {
      const refactoring: Refactoring = {
        type: "class_rename",
        from: "OldClass",
        to: "NewClass",
        confidence: 0.8,
        file: "src/file.ts",
      };

      expect(isValidRefactoring(refactoring)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isValidRefactoring(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isValidRefactoring(undefined)).toBe(false);
    });

    it("should return false for non-object types", () => {
      expect(isValidRefactoring("string")).toBe(false);
      expect(isValidRefactoring(123)).toBe(false);
      expect(isValidRefactoring(true)).toBe(false);
      expect(isValidRefactoring([])).toBe(false);
    });

    it("should return false for invalid refactoring type", () => {
      const invalid = {
        type: "invalid_type",
        from: "old",
        to: "new",
        confidence: 0.5,
        file: "src/file.ts",
      };

      expect(isValidRefactoring(invalid)).toBe(false);
    });

    it("should return false when from is not a string", () => {
      const invalid = {
        type: "function_rename",
        from: 123,
        to: "new",
        confidence: 0.5,
        file: "src/file.ts",
      };

      expect(isValidRefactoring(invalid)).toBe(false);
    });

    it("should return false when to is not a string", () => {
      const invalid = {
        type: "function_rename",
        from: "old",
        to: 123,
        confidence: 0.5,
        file: "src/file.ts",
      };

      expect(isValidRefactoring(invalid)).toBe(false);
    });

    it("should return false when confidence is not a number", () => {
      const invalid = {
        type: "function_rename",
        from: "old",
        to: "new",
        confidence: "0.5",
        file: "src/file.ts",
      };

      expect(isValidRefactoring(invalid)).toBe(false);
    });

    it("should return false when confidence is less than 0", () => {
      const invalid = {
        type: "function_rename",
        from: "old",
        to: "new",
        confidence: -0.1,
        file: "src/file.ts",
      };

      expect(isValidRefactoring(invalid)).toBe(false);
    });

    it("should return false when confidence is greater than 1", () => {
      const invalid = {
        type: "function_rename",
        from: "old",
        to: "new",
        confidence: 1.1,
        file: "src/file.ts",
      };

      expect(isValidRefactoring(invalid)).toBe(false);
    });

    it("should return false when confidence is Infinity", () => {
      const invalid = {
        type: "function_rename",
        from: "old",
        to: "new",
        confidence: Infinity,
        file: "src/file.ts",
      };

      expect(isValidRefactoring(invalid)).toBe(false);
    });

    it("should return false when file is not a string", () => {
      const invalid = {
        type: "function_rename",
        from: "old",
        to: "new",
        confidence: 0.5,
        file: 123,
      };

      expect(isValidRefactoring(invalid)).toBe(false);
    });

    it("should return false when description is not a string", () => {
      const invalid = {
        type: "function_rename",
        from: "old",
        to: "new",
        confidence: 0.5,
        file: "src/file.ts",
        description: 123,
      };

      expect(isValidRefactoring(invalid)).toBe(false);
    });

    it("should return true for confidence at boundaries", () => {
      const minConfidence: Refactoring = {
        type: "function_rename",
        from: "old",
        to: "new",
        confidence: 0,
        file: "src/file.ts",
      };

      const maxConfidence: Refactoring = {
        type: "function_rename",
        from: "old",
        to: "new",
        confidence: 1,
        file: "src/file.ts",
      };

      expect(isValidRefactoring(minConfidence)).toBe(true);
      expect(isValidRefactoring(maxConfidence)).toBe(true);
    });

    it("should return true for all valid refactoring types", () => {
      const types = [
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

      types.forEach((type) => {
        const refactoring: Refactoring = {
          type,
          from: "old",
          to: "new",
          confidence: 0.5,
          file: "src/file.ts",
        };

        expect(isValidRefactoring(refactoring)).toBe(true);
      });
    });
  });

  describe("isValidStructuralChange", () => {
    it("should return true for valid structural change objects", () => {
      const validChange: StructuralChange = {
        type: "added",
        nodeType: "function",
        name: "newFunction",
        file: "src/file.ts",
        lineRange: [10, 20],
        isPublicAPI: true,
      };

      expect(isValidStructuralChange(validChange)).toBe(true);
    });

    it("should return true for structural change without optional properties", () => {
      const change: StructuralChange = {
        type: "modified",
        nodeType: "class",
        name: "TestClass",
        file: "src/file.ts",
      };

      expect(isValidStructuralChange(change)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isValidStructuralChange(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isValidStructuralChange(undefined)).toBe(false);
    });

    it("should return false for non-object types", () => {
      expect(isValidStructuralChange("string")).toBe(false);
      expect(isValidStructuralChange(123)).toBe(false);
      expect(isValidStructuralChange(true)).toBe(false);
    });

    it("should return false for invalid type", () => {
      const invalid = {
        type: "invalid",
        nodeType: "function",
        name: "test",
        file: "src/file.ts",
      };

      expect(isValidStructuralChange(invalid)).toBe(false);
    });

    it("should return false when nodeType is not a string", () => {
      const invalid = {
        type: "added",
        nodeType: 123,
        name: "test",
        file: "src/file.ts",
      };

      expect(isValidStructuralChange(invalid)).toBe(false);
    });

    it("should return false when name is not a string", () => {
      const invalid = {
        type: "added",
        nodeType: "function",
        name: 123,
        file: "src/file.ts",
      };

      expect(isValidStructuralChange(invalid)).toBe(false);
    });

    it("should return false when file is not a string", () => {
      const invalid = {
        type: "added",
        nodeType: "function",
        name: "test",
        file: 123,
      };

      expect(isValidStructuralChange(invalid)).toBe(false);
    });

    it("should return false when lineRange is not a valid tuple", () => {
      const invalid1 = {
        type: "added",
        nodeType: "function",
        name: "test",
        file: "src/file.ts",
        lineRange: "invalid",
      };

      const invalid2 = {
        type: "added",
        nodeType: "function",
        name: "test",
        file: "src/file.ts",
        lineRange: [10],
      };

      const invalid3 = {
        type: "added",
        nodeType: "function",
        name: "test",
        file: "src/file.ts",
        lineRange: [10, 20, 30],
      };

      const invalid4 = {
        type: "added",
        nodeType: "function",
        name: "test",
        file: "src/file.ts",
        lineRange: ["10", "20"],
      };

      const invalid5 = {
        type: "added",
        nodeType: "function",
        name: "test",
        file: "src/file.ts",
        lineRange: [Infinity, 20],
      };

      expect(isValidStructuralChange(invalid1)).toBe(false);
      expect(isValidStructuralChange(invalid2)).toBe(false);
      expect(isValidStructuralChange(invalid3)).toBe(false);
      expect(isValidStructuralChange(invalid4)).toBe(false);
      expect(isValidStructuralChange(invalid5)).toBe(false);
    });

    it("should return false when isPublicAPI is not a boolean", () => {
      const invalid = {
        type: "added",
        nodeType: "function",
        name: "test",
        file: "src/file.ts",
        isPublicAPI: "true",
      };

      expect(isValidStructuralChange(invalid)).toBe(false);
    });

    it("should return true for all valid structural change types", () => {
      const types = ["added", "modified", "removed"] as const;

      types.forEach((type) => {
        const change: StructuralChange = {
          type,
          nodeType: "function",
          name: "test",
          file: "src/file.ts",
        };

        expect(isValidStructuralChange(change)).toBe(true);
      });
    });

    it("should return true for valid lineRange", () => {
      const change: StructuralChange = {
        type: "added",
        nodeType: "function",
        name: "test",
        file: "src/file.ts",
        lineRange: [1, 100],
      };

      expect(isValidStructuralChange(change)).toBe(true);
    });
  });

  describe("isValidSemanticImpact", () => {
    it("should return true for valid semantic impact objects", () => {
      const validImpact: SemanticImpact = {
        type: "breaking_change",
        file: "src/api.ts",
        severity: "high",
        description: "API changed",
      };

      expect(isValidSemanticImpact(validImpact)).toBe(true);
    });

    it("should return true for semantic impact without description", () => {
      const impact: SemanticImpact = {
        type: "api_change",
        file: "src/file.ts",
        severity: "medium",
      };

      expect(isValidSemanticImpact(impact)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isValidSemanticImpact(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isValidSemanticImpact(undefined)).toBe(false);
    });

    it("should return false for non-object types", () => {
      expect(isValidSemanticImpact("string")).toBe(false);
      expect(isValidSemanticImpact(123)).toBe(false);
      expect(isValidSemanticImpact(true)).toBe(false);
    });

    it("should return false for invalid type", () => {
      const invalid = {
        type: "invalid_type",
        file: "src/file.ts",
        severity: "high",
      };

      expect(isValidSemanticImpact(invalid)).toBe(false);
    });

    it("should return false when file is not a string", () => {
      const invalid = {
        type: "breaking_change",
        file: 123,
        severity: "high",
      };

      expect(isValidSemanticImpact(invalid)).toBe(false);
    });

    it("should return false for invalid severity", () => {
      const invalid = {
        type: "breaking_change",
        file: "src/file.ts",
        severity: "critical",
      };

      expect(isValidSemanticImpact(invalid)).toBe(false);
    });

    it("should return false when description is not a string", () => {
      const invalid = {
        type: "breaking_change",
        file: "src/file.ts",
        severity: "high",
        description: 123,
      };

      expect(isValidSemanticImpact(invalid)).toBe(false);
    });

    it("should return true for all valid semantic impact types", () => {
      const types = [
        "api_change",
        "breaking_change",
        "dependency_change",
        "type_change",
      ] as const;

      types.forEach((type) => {
        const impact: SemanticImpact = {
          type,
          file: "src/file.ts",
          severity: "medium",
        };

        expect(isValidSemanticImpact(impact)).toBe(true);
      });
    });

    it("should return true for all valid severity levels", () => {
      const severities = ["low", "medium", "high"] as const;

      severities.forEach((severity) => {
        const impact: SemanticImpact = {
          type: "api_change",
          file: "src/file.ts",
          severity,
        };

        expect(isValidSemanticImpact(impact)).toBe(true);
      });
    });
  });

  describe("isValidASTAnalysis", () => {
    it("should return true for valid ASTAnalysis objects", () => {
      const validAnalysis: ASTAnalysis = {
        refactorings: [
          {
            type: "function_rename",
            from: "old",
            to: "new",
            confidence: 0.8,
            file: "src/file.ts",
          },
        ],
        structuralChanges: [
          {
            type: "added",
            nodeType: "function",
            name: "newFunction",
            file: "src/file.ts",
          },
        ],
        semanticImpact: [
          {
            type: "breaking_change",
            file: "src/api.ts",
            severity: "high",
          },
        ],
      };

      expect(isValidASTAnalysis(validAnalysis)).toBe(true);
    });

    it("should return true for empty ASTAnalysis", () => {
      const analysis: ASTAnalysis = {
        refactorings: [],
        structuralChanges: [],
        semanticImpact: [],
      };

      expect(isValidASTAnalysis(analysis)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isValidASTAnalysis(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isValidASTAnalysis(undefined)).toBe(false);
    });

    it("should return false for non-object types", () => {
      expect(isValidASTAnalysis("string")).toBe(false);
      expect(isValidASTAnalysis(123)).toBe(false);
      expect(isValidASTAnalysis(true)).toBe(false);
    });

    it("should return false when refactorings is not an array", () => {
      const invalid = {
        refactorings: "not an array",
        structuralChanges: [],
        semanticImpact: [],
      };

      expect(isValidASTAnalysis(invalid)).toBe(false);
    });

    it("should return false when refactorings contains invalid items", () => {
      const invalid = {
        refactorings: [
          {
            type: "invalid_type",
            from: "old",
            to: "new",
            confidence: 0.5,
            file: "src/file.ts",
          },
        ],
        structuralChanges: [],
        semanticImpact: [],
      };

      expect(isValidASTAnalysis(invalid)).toBe(false);
    });

    it("should return false when structuralChanges is not an array", () => {
      const invalid = {
        refactorings: [],
        structuralChanges: "not an array",
        semanticImpact: [],
      };

      expect(isValidASTAnalysis(invalid)).toBe(false);
    });

    it("should return false when structuralChanges contains invalid items", () => {
      const invalid = {
        refactorings: [],
        structuralChanges: [
          {
            type: "invalid",
            nodeType: "function",
            name: "test",
            file: "src/file.ts",
          },
        ],
        semanticImpact: [],
      };

      expect(isValidASTAnalysis(invalid)).toBe(false);
    });

    it("should return false when semanticImpact is not an array", () => {
      const invalid = {
        refactorings: [],
        structuralChanges: [],
        semanticImpact: "not an array",
      };

      expect(isValidASTAnalysis(invalid)).toBe(false);
    });

    it("should return false when semanticImpact contains invalid items", () => {
      const invalid = {
        refactorings: [],
        structuralChanges: [],
        semanticImpact: [
          {
            type: "invalid",
            file: "src/file.ts",
            severity: "high",
          },
        ],
      };

      expect(isValidASTAnalysis(invalid)).toBe(false);
    });
  });

  describe("createEmptyASTAnalysis", () => {
    it("should create a valid empty ASTAnalysis", () => {
      const analysis = createEmptyASTAnalysis();

      expect(isValidASTAnalysis(analysis)).toBe(true);
      expect(analysis.refactorings).toEqual([]);
      expect(analysis.structuralChanges).toEqual([]);
      expect(analysis.semanticImpact).toEqual([]);
    });

    it("should return a new object each time", () => {
      const analysis1 = createEmptyASTAnalysis();
      const analysis2 = createEmptyASTAnalysis();

      expect(analysis1).not.toBe(analysis2);
      expect(analysis1).toEqual(analysis2);
    });

    it("should return an ASTAnalysis that can be modified without affecting others", () => {
      const analysis1 = createEmptyASTAnalysis();
      const analysis2 = createEmptyASTAnalysis();

      analysis1.refactorings.push({
        type: "function_rename",
        from: "old",
        to: "new",
        confidence: 0.8,
        file: "src/file.ts",
      });

      expect(analysis1.refactorings).toHaveLength(1);
      expect(analysis2.refactorings).toHaveLength(0);
    });
  });
});

