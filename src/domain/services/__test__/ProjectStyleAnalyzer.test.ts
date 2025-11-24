/**
 * Tests for ProjectStyleAnalyzer domain interfaces
 * Tests the ProjectStyle structure and IProjectStyleAnalyzer contract
 */

import { describe, it, expect, vi } from "vitest";
import {
  type IProjectStyleAnalyzer,
  type ProjectStyle,
  isValidProjectStyle,
  createDefaultProjectStyle,
} from "../ProjectStyleAnalyzer.js";
import type { IGitRepository } from "../../repositories/IGitRepository.js";

describe("ProjectStyleAnalyzer Domain", () => {
  describe("ProjectStyle interface", () => {
    it("should accept a valid ProjectStyle object with all properties", () => {
      const style: ProjectStyle = {
        preferredTypes: ["feat", "fix", "chore"],
        avgSubjectLength: 50,
        commonScopes: ["api", "ui"],
        detailLevel: "detailed",
        templates: ["add X", "fix X"],
        conventionCompliance: 85,
      };

      expect(style.preferredTypes).toEqual(["feat", "fix", "chore"]);
      expect(style.avgSubjectLength).toBe(50);
      expect(style.commonScopes).toEqual(["api", "ui"]);
      expect(style.detailLevel).toBe("detailed");
      expect(style.templates).toEqual(["add X", "fix X"]);
      expect(style.conventionCompliance).toBe(85);
    });

    it("should accept ProjectStyle with concise detailLevel", () => {
      const style: ProjectStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 30,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 100,
      };

      expect(style.detailLevel).toBe("concise");
    });

    it("should accept ProjectStyle with detailed detailLevel", () => {
      const style: ProjectStyle = {
        preferredTypes: ["feat", "fix"],
        avgSubjectLength: 60,
        commonScopes: ["api"],
        detailLevel: "detailed",
        templates: ["add feature"],
        conventionCompliance: 90,
      };

      expect(style.detailLevel).toBe("detailed");
    });

    it("should accept ProjectStyle with empty arrays", () => {
      const style: ProjectStyle = {
        preferredTypes: [],
        avgSubjectLength: 0,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 0,
      };

      expect(style.preferredTypes).toEqual([]);
      expect(style.commonScopes).toEqual([]);
      expect(style.templates).toEqual([]);
    });

    it("should accept ProjectStyle with conventionCompliance at boundaries", () => {
      const minStyle: ProjectStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 10,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 0,
      };

      const maxStyle: ProjectStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 100,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 100,
      };

      expect(minStyle.conventionCompliance).toBe(0);
      expect(maxStyle.conventionCompliance).toBe(100);
    });

    it("should accept ProjectStyle with multiple preferred types", () => {
      const style: ProjectStyle = {
        preferredTypes: ["feat", "fix", "chore", "docs", "refactor"],
        avgSubjectLength: 45,
        commonScopes: ["api", "ui", "auth", "db"],
        detailLevel: "detailed",
        templates: ["add X", "fix X", "update X", "remove X", "refactor X"],
        conventionCompliance: 95,
      };

      expect(style.preferredTypes.length).toBe(5);
      expect(style.commonScopes.length).toBe(4);
      expect(style.templates.length).toBe(5);
    });

    it("should accept ProjectStyle with average subject length at various values", () => {
      const shortStyle: ProjectStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 5,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 50,
      };

      const longStyle: ProjectStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 150,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 50,
      };

      expect(shortStyle.avgSubjectLength).toBe(5);
      expect(longStyle.avgSubjectLength).toBe(150);
    });
  });

  describe("IProjectStyleAnalyzer interface", () => {
    it("should allow implementation with correct method signature", async () => {
      const mockGitRepository: IGitRepository = {
        getCommitHistory: vi.fn().mockResolvedValue([]),
      } as unknown as IGitRepository;

      const analyzer: IProjectStyleAnalyzer = {
        analyzeProjectStyle: vi.fn().mockResolvedValue({
          preferredTypes: ["feat", "fix", "chore"],
          avgSubjectLength: 50,
          commonScopes: [],
          detailLevel: "concise",
          templates: [],
          conventionCompliance: 0,
        }),
      };

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      expect(result).toBeDefined();
      expect(result.preferredTypes).toBeDefined();
      expect(result.avgSubjectLength).toBeDefined();
      expect(result.commonScopes).toBeDefined();
      expect(result.detailLevel).toBeDefined();
      expect(result.templates).toBeDefined();
      expect(result.conventionCompliance).toBeDefined();
    });

    it("should allow implementation with custom maxCommits parameter", async () => {
      const mockGitRepository: IGitRepository = {
        getCommitHistory: vi.fn().mockResolvedValue([]),
      } as unknown as IGitRepository;

      const analyzer: IProjectStyleAnalyzer = {
        analyzeProjectStyle: vi.fn().mockResolvedValue({
          preferredTypes: ["feat"],
          avgSubjectLength: 50,
          commonScopes: [],
          detailLevel: "concise",
          templates: [],
          conventionCompliance: 0,
        }),
      };

      await analyzer.analyzeProjectStyle(mockGitRepository, 200);

      expect(analyzer.analyzeProjectStyle).toHaveBeenCalledWith(
        mockGitRepository,
        200,
      );
    });

    it("should allow implementation with default maxCommits parameter", async () => {
      const mockGitRepository: IGitRepository = {
        getCommitHistory: vi.fn().mockResolvedValue([]),
      } as unknown as IGitRepository;

      const analyzer: IProjectStyleAnalyzer = {
        analyzeProjectStyle: vi.fn().mockResolvedValue({
          preferredTypes: ["feat"],
          avgSubjectLength: 50,
          commonScopes: [],
          detailLevel: "concise",
          templates: [],
          conventionCompliance: 0,
        }),
      };

      await analyzer.analyzeProjectStyle(mockGitRepository);

      // When maxCommits is not provided, it's optional and may not be passed
      expect(analyzer.analyzeProjectStyle).toHaveBeenCalledWith(
        mockGitRepository,
      );
      expect(analyzer.analyzeProjectStyle).toHaveBeenCalledTimes(1);
    });

    it("should return ProjectStyle conforming to interface", async () => {
      const mockGitRepository: IGitRepository = {
        getCommitHistory: vi.fn().mockResolvedValue([]),
      } as unknown as IGitRepository;

      const expectedStyle: ProjectStyle = {
        preferredTypes: ["feat", "fix"],
        avgSubjectLength: 45,
        commonScopes: ["api"],
        detailLevel: "detailed",
        templates: ["add X"],
        conventionCompliance: 90,
      };

      const analyzer: IProjectStyleAnalyzer = {
        analyzeProjectStyle: vi.fn().mockResolvedValue(expectedStyle),
      };

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      // Verify all required properties are present
      expect(result).toHaveProperty("preferredTypes");
      expect(result).toHaveProperty("avgSubjectLength");
      expect(result).toHaveProperty("commonScopes");
      expect(result).toHaveProperty("detailLevel");
      expect(result).toHaveProperty("templates");
      expect(result).toHaveProperty("conventionCompliance");

      // Verify types
      expect(Array.isArray(result.preferredTypes)).toBe(true);
      expect(typeof result.avgSubjectLength).toBe("number");
      expect(Array.isArray(result.commonScopes)).toBe(true);
      expect(["detailed", "concise"]).toContain(result.detailLevel);
      expect(Array.isArray(result.templates)).toBe(true);
      expect(typeof result.conventionCompliance).toBe("number");
      expect(result.conventionCompliance).toBeGreaterThanOrEqual(0);
      expect(result.conventionCompliance).toBeLessThanOrEqual(100);
    });

    it("should handle async operations correctly", async () => {
      const mockGitRepository: IGitRepository = {
        getCommitHistory: vi.fn().mockResolvedValue([]),
      } as unknown as IGitRepository;

      const analyzer: IProjectStyleAnalyzer = {
        analyzeProjectStyle: vi.fn().mockImplementation(
          async (repo: IGitRepository, maxCommits?: number) => {
            await repo.getCommitHistory(maxCommits);
            return {
              preferredTypes: ["feat"],
              avgSubjectLength: 50,
              commonScopes: [],
              detailLevel: "concise",
              templates: [],
              conventionCompliance: 0,
            };
          },
        ),
      };

      const result = await analyzer.analyzeProjectStyle(mockGitRepository, 50);

      expect(result).toBeDefined();
      expect(mockGitRepository.getCommitHistory).toHaveBeenCalledWith(50);
    });

    it("should allow implementation to use gitRepository parameter", async () => {
      const mockGitRepository: IGitRepository = {
        getCommitHistory: vi.fn().mockResolvedValue([
          {
            hash: "abc123",
            message: "feat: test",
            date: "2024-01-01",
            author: "test@example.com",
          },
        ]),
      } as unknown as IGitRepository;

      const analyzer: IProjectStyleAnalyzer = {
        analyzeProjectStyle: vi.fn().mockImplementation(
          async (repo: IGitRepository) => {
            const commits = await repo.getCommitHistory();
            return {
              preferredTypes: commits.length > 0 ? ["feat"] : [],
              avgSubjectLength: 50,
              commonScopes: [],
              detailLevel: "concise",
              templates: [],
              conventionCompliance: commits.length > 0 ? 100 : 0,
            };
          },
        ),
      };

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      expect(result.preferredTypes).toEqual(["feat"]);
      expect(result.conventionCompliance).toBe(100);
      expect(mockGitRepository.getCommitHistory).toHaveBeenCalled();
    });
  });

  describe("Type safety and contract validation", () => {
    it("should enforce detailLevel to be either 'detailed' or 'concise'", () => {
      const detailedStyle: ProjectStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "detailed",
        templates: [],
        conventionCompliance: 50,
      };

      const conciseStyle: ProjectStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 50,
      };

      expect(detailedStyle.detailLevel).toBe("detailed");
      expect(conciseStyle.detailLevel).toBe("concise");
    });

    it("should enforce conventionCompliance to be between 0 and 100", () => {
      const validStyles: ProjectStyle[] = [
        {
          preferredTypes: ["feat"],
          avgSubjectLength: 50,
          commonScopes: [],
          detailLevel: "concise",
          templates: [],
          conventionCompliance: 0,
        },
        {
          preferredTypes: ["feat"],
          avgSubjectLength: 50,
          commonScopes: [],
          detailLevel: "concise",
          templates: [],
          conventionCompliance: 50,
        },
        {
          preferredTypes: ["feat"],
          avgSubjectLength: 50,
          commonScopes: [],
          detailLevel: "concise",
          templates: [],
          conventionCompliance: 100,
        },
      ];

      validStyles.forEach((style) => {
        expect(style.conventionCompliance).toBeGreaterThanOrEqual(0);
        expect(style.conventionCompliance).toBeLessThanOrEqual(100);
      });
    });

    it("should enforce all arrays to be arrays of strings", () => {
      const style: ProjectStyle = {
        preferredTypes: ["feat", "fix", "chore"],
        avgSubjectLength: 50,
        commonScopes: ["api", "ui"],
        detailLevel: "concise",
        templates: ["add X", "fix X"],
        conventionCompliance: 50,
      };

      style.preferredTypes.forEach((type) => {
        expect(typeof type).toBe("string");
      });

      style.commonScopes.forEach((scope) => {
        expect(typeof scope).toBe("string");
      });

      style.templates.forEach((template) => {
        expect(typeof template).toBe("string");
      });
    });

    it("should enforce avgSubjectLength to be a number", () => {
      const style: ProjectStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 42.5,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 50,
      };

      expect(typeof style.avgSubjectLength).toBe("number");
      expect(Number.isFinite(style.avgSubjectLength)).toBe(true);
    });
  });

  describe("isValidProjectStyle", () => {
    it("should return true for valid ProjectStyle objects", () => {
      const validStyle: ProjectStyle = {
        preferredTypes: ["feat", "fix"],
        avgSubjectLength: 50,
        commonScopes: ["api"],
        detailLevel: "detailed",
        templates: ["add X"],
        conventionCompliance: 85,
      };

      expect(isValidProjectStyle(validStyle)).toBe(true);
    });

    it("should return true for concise detailLevel", () => {
      const style: ProjectStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 30,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 100,
      };

      expect(isValidProjectStyle(style)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isValidProjectStyle(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isValidProjectStyle(undefined)).toBe(false);
    });

    it("should return false for non-object types", () => {
      expect(isValidProjectStyle("string")).toBe(false);
      expect(isValidProjectStyle(123)).toBe(false);
      expect(isValidProjectStyle(true)).toBe(false);
      expect(isValidProjectStyle([])).toBe(false);
    });

    it("should return false when preferredTypes is not an array", () => {
      const invalidStyle = {
        preferredTypes: "not an array",
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 50,
      };

      expect(isValidProjectStyle(invalidStyle)).toBe(false);
    });

    it("should return false when avgSubjectLength is not a number", () => {
      const invalidStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: "not a number",
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 50,
      };

      expect(isValidProjectStyle(invalidStyle)).toBe(false);
    });

    it("should return false when avgSubjectLength is not finite", () => {
      const invalidStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: Infinity,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 50,
      };

      expect(isValidProjectStyle(invalidStyle)).toBe(false);
    });

    it("should return false when commonScopes is not an array", () => {
      const invalidStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 50,
        commonScopes: "not an array",
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 50,
      };

      expect(isValidProjectStyle(invalidStyle)).toBe(false);
    });

    it("should return false when detailLevel is invalid", () => {
      const invalidStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "invalid",
        templates: [],
        conventionCompliance: 50,
      };

      expect(isValidProjectStyle(invalidStyle)).toBe(false);
    });

    it("should return false when templates is not an array", () => {
      const invalidStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "concise",
        templates: "not an array",
        conventionCompliance: 50,
      };

      expect(isValidProjectStyle(invalidStyle)).toBe(false);
    });

    it("should return false when conventionCompliance is not a number", () => {
      const invalidStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: "not a number",
      };

      expect(isValidProjectStyle(invalidStyle)).toBe(false);
    });

    it("should return false when conventionCompliance is less than 0", () => {
      const invalidStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: -1,
      };

      expect(isValidProjectStyle(invalidStyle)).toBe(false);
    });

    it("should return false when conventionCompliance is greater than 100", () => {
      const invalidStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 101,
      };

      expect(isValidProjectStyle(invalidStyle)).toBe(false);
    });

    it("should return false when conventionCompliance is Infinity", () => {
      const invalidStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: Infinity,
      };

      expect(isValidProjectStyle(invalidStyle)).toBe(false);
    });

    it("should return false when preferredTypes contains non-string values", () => {
      const invalidStyle = {
        preferredTypes: [123, "feat"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 50,
      };

      expect(isValidProjectStyle(invalidStyle)).toBe(false);
    });

    it("should return false when commonScopes contains non-string values", () => {
      const invalidStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 50,
        commonScopes: [123, "api"],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 50,
      };

      expect(isValidProjectStyle(invalidStyle)).toBe(false);
    });

    it("should return false when templates contains non-string values", () => {
      const invalidStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "concise",
        templates: [123, "add X"],
        conventionCompliance: 50,
      };

      expect(isValidProjectStyle(invalidStyle)).toBe(false);
    });

    it("should return true for valid ProjectStyle with empty arrays", () => {
      const style: ProjectStyle = {
        preferredTypes: [],
        avgSubjectLength: 0,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 0,
      };

      expect(isValidProjectStyle(style)).toBe(true);
    });

    it("should return true for conventionCompliance at boundaries", () => {
      const minStyle: ProjectStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 0,
      };

      const maxStyle: ProjectStyle = {
        preferredTypes: ["feat"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 100,
      };

      expect(isValidProjectStyle(minStyle)).toBe(true);
      expect(isValidProjectStyle(maxStyle)).toBe(true);
    });
  });

  describe("createDefaultProjectStyle", () => {
    it("should create a valid default ProjectStyle", () => {
      const defaultStyle = createDefaultProjectStyle();

      expect(isValidProjectStyle(defaultStyle)).toBe(true);
      expect(defaultStyle.preferredTypes).toEqual(["feat", "fix", "chore"]);
      expect(defaultStyle.avgSubjectLength).toBe(50);
      expect(defaultStyle.commonScopes).toEqual([]);
      expect(defaultStyle.detailLevel).toBe("concise");
      expect(defaultStyle.templates).toEqual([]);
      expect(defaultStyle.conventionCompliance).toBe(0);
    });

    it("should return a new object each time", () => {
      const style1 = createDefaultProjectStyle();
      const style2 = createDefaultProjectStyle();

      expect(style1).not.toBe(style2);
      expect(style1).toEqual(style2);
    });

    it("should return a ProjectStyle that can be modified without affecting others", () => {
      const style1 = createDefaultProjectStyle();
      const style2 = createDefaultProjectStyle();

      style1.preferredTypes.push("docs");
      style2.commonScopes.push("api");

      expect(style1.preferredTypes).toEqual(["feat", "fix", "chore", "docs"]);
      expect(style2.preferredTypes).toEqual(["feat", "fix", "chore"]);
      expect(style1.commonScopes).toEqual([]);
      expect(style2.commonScopes).toEqual(["api"]);
    });
  });
});

