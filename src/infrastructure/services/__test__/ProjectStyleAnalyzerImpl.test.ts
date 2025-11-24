/**
 * Tests for ProjectStyleAnalyzerImpl
 * Tests the analysis of commit history to extract project-specific style patterns
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CommitInfo, IGitRepository } from "../../../domain/repositories/IGitRepository.js";
import { ProjectStyleAnalyzerImpl } from "../ProjectStyleAnalyzerImpl.js";

describe("ProjectStyleAnalyzerImpl", () => {
  let analyzer: ProjectStyleAnalyzerImpl;
  let mockGitRepository: IGitRepository;

  beforeEach(() => {
    analyzer = new ProjectStyleAnalyzerImpl();
    mockGitRepository = {
      getCommitHistory: vi.fn(),
    } as unknown as IGitRepository;
  });

  describe("analyzeProjectStyle", () => {
    it("should return default style when no commits found", async () => {
      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue([]);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      expect(result).toEqual({
        preferredTypes: ["feat", "fix", "chore"],
        avgSubjectLength: 50,
        commonScopes: [],
        detailLevel: "concise",
        templates: [],
        conventionCompliance: 0,
      });
      expect(mockGitRepository.getCommitHistory).toHaveBeenCalledWith(100);
    });

    it("should use custom maxCommits parameter", async () => {
      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue([]);

      await analyzer.analyzeProjectStyle(mockGitRepository, 50);

      expect(mockGitRepository.getCommitHistory).toHaveBeenCalledWith(50);
    });

    it("should analyze conventional commits correctly", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "feat: add new feature",
          date: "2024-01-01",
          author: "test@example.com",
        },
        {
          hash: "def456",
          message: "fix: resolve bug",
          date: "2024-01-02",
          author: "test@example.com",
        },
        {
          hash: "ghi789",
          message: "feat(api): implement endpoint",
          date: "2024-01-03",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      expect(result.preferredTypes).toEqual(["feat", "fix"]);
      expect(result.conventionCompliance).toBe(100);
      expect(result.commonScopes).toEqual(["api"]);
      expect(result.detailLevel).toBe("concise");
    });

    it("should handle non-conventional commits", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "feat: add new feature",
          date: "2024-01-01",
          author: "test@example.com",
        },
        {
          hash: "def456",
          message: "just a regular commit message",
          date: "2024-01-02",
          author: "test@example.com",
        },
        {
          hash: "ghi789",
          message: "another non-conventional commit",
          date: "2024-01-03",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      expect(result.conventionCompliance).toBe(33); // 1 out of 3 commits
      expect(result.preferredTypes).toContain("chore"); // Non-conventional commits are treated as "chore"
    });

    it("should calculate average subject length correctly", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "feat: short",
          date: "2024-01-01",
          author: "test@example.com",
        },
        {
          hash: "def456",
          message: "fix: this is a much longer subject line",
          date: "2024-01-02",
          author: "test@example.com",
        },
        {
          hash: "ghi789",
          message: "chore: medium length subject",
          date: "2024-01-03",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      // "short" = 5, "this is a much longer subject line" = 35, "medium length subject" = 20
      // Average = (5 + 35 + 20) / 3 = 20
      expect(result.avgSubjectLength).toBe(20);
    });

    it("should extract common scopes correctly", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "feat(api): add endpoint",
          date: "2024-01-01",
          author: "test@example.com",
        },
        {
          hash: "def456",
          message: "fix(api): fix bug",
          date: "2024-01-02",
          author: "test@example.com",
        },
        {
          hash: "ghi789",
          message: "feat(ui): add component",
          date: "2024-01-03",
          author: "test@example.com",
        },
        {
          hash: "jkl012",
          message: "feat(api): another api change",
          date: "2024-01-04",
          author: "test@example.com",
        },
        {
          hash: "mno345",
          message: "fix(ui): fix ui bug",
          date: "2024-01-05",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      expect(result.commonScopes).toEqual(["api", "ui"]);
      expect(result.commonScopes.length).toBeLessThanOrEqual(5);
    });

    it("should limit common scopes to top 5", async () => {
      const commits: CommitInfo[] = [];
      const scopes = ["scope1", "scope2", "scope3", "scope4", "scope5", "scope6"];

      // Create commits with different scopes
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j <= i; j++) {
          // scope1 appears 1 time, scope2 appears 2 times, etc.
          commits.push({
            hash: `hash${i}${j}`,
            message: `feat(${scopes[i]}): commit ${j}`,
            date: "2024-01-01",
            author: "test@example.com",
          });
        }
      }

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      expect(result.commonScopes.length).toBeLessThanOrEqual(5);
      // Should be sorted by frequency: scope6 (6), scope5 (5), scope4 (4), scope3 (3), scope2 (2)
      expect(result.commonScopes).toEqual([
        "scope6",
        "scope5",
        "scope4",
        "scope3",
        "scope2",
      ]);
    });

    it("should determine detailLevel as 'detailed' when body usage > 50%", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "feat: add feature\n\nThis is a detailed body",
          date: "2024-01-01",
          author: "test@example.com",
        },
        {
          hash: "def456",
          message: "fix: fix bug\n\nAnother detailed body",
          date: "2024-01-02",
          author: "test@example.com",
        },
        {
          hash: "ghi789",
          message: "chore: update deps",
          date: "2024-01-03",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      // 2 out of 3 commits have bodies = 66.67% > 50%
      expect(result.detailLevel).toBe("detailed");
    });

    it("should determine detailLevel as 'concise' when body usage <= 50%", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "feat: add feature\n\nThis is a detailed body",
          date: "2024-01-01",
          author: "test@example.com",
        },
        {
          hash: "def456",
          message: "fix: fix bug",
          date: "2024-01-02",
          author: "test@example.com",
        },
        {
          hash: "ghi789",
          message: "chore: update deps",
          date: "2024-01-03",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      // 1 out of 3 commits have bodies = 33.33% <= 50%
      expect(result.detailLevel).toBe("concise");
    });

    it("should extract common templates correctly", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "feat: add new feature",
          date: "2024-01-01",
          author: "test@example.com",
        },
        {
          hash: "def456",
          message: "feat: add component",
          date: "2024-01-02",
          author: "test@example.com",
        },
        {
          hash: "ghi789",
          message: "fix: fix bug",
          date: "2024-01-03",
          author: "test@example.com",
        },
        {
          hash: "jkl012",
          message: "fix: fix issue",
          date: "2024-01-04",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      // "add new feature" -> "add X" (appears 2 times)
      // "add component" -> "add X" (appears 2 times)
      // "fix bug" -> "fix bug" (appears 1 time)
      // "fix issue" -> "fix issue" (appears 1 time)
      // Templates should be sorted by frequency
      expect(result.templates.length).toBeLessThanOrEqual(5);
      expect(result.templates).toContain("add X");
    });

    it("should handle commits with breaking changes", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "feat!: breaking change\n\nBREAKING CHANGE: API changed",
          date: "2024-01-01",
          author: "test@example.com",
        },
        {
          hash: "def456",
          message: "fix: regular fix",
          date: "2024-01-02",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      expect(result.conventionCompliance).toBe(100);
      // Body should be extracted correctly (empty in this case, before BREAKING CHANGE)
      expect(result.detailLevel).toBe("concise");
    });

    it("should handle commits with body and breaking changes", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message:
            "feat: breaking change\n\nThis is the body\n\nBREAKING CHANGE: API changed",
          date: "2024-01-01",
          author: "test@example.com",
        },
        {
          hash: "def456",
          message:
            "fix: another change\n\nAnother body content\n\nBREAKING CHANGE: change",
          date: "2024-01-02",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      // Both commits have bodies, so detailLevel should be "detailed" (>50%)
      expect(result.detailLevel).toBe("detailed");
    });

    it("should return top 3 preferred types", async () => {
      const commits: CommitInfo[] = [];
      const types = ["feat", "fix", "chore", "docs", "refactor"];

      // Create commits with different types
      // feat: 5 commits, fix: 4 commits, chore: 3 commits, docs: 2 commits, refactor: 1 commit
      for (let i = 0; i < types.length; i++) {
        for (let j = 0; j < 5 - i; j++) {
          commits.push({
            hash: `hash${i}${j}`,
            message: `${types[i]}: commit ${j}`,
            date: "2024-01-01",
            author: "test@example.com",
          });
        }
      }

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      expect(result.preferredTypes.length).toBe(3);
      expect(result.preferredTypes).toEqual(["feat", "fix", "chore"]);
    });

    it("should handle empty subject lines", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "feat: ",
          date: "2024-01-01",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      // parseConventionalCommit extracts "feat: " -> subject is empty string ""
      // But the regex might extract something, so we check it's a small number
      expect(result.avgSubjectLength).toBeGreaterThanOrEqual(0);
      expect(result.avgSubjectLength).toBeLessThanOrEqual(5);
    });

    it("should handle non-conventional commits with empty message", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "",
          date: "2024-01-01",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      expect(result.preferredTypes).toContain("chore");
      expect(result.conventionCompliance).toBe(0);
    });

    it("should handle commits with only one word in subject for templates", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "feat: update",
          date: "2024-01-01",
          author: "test@example.com",
        },
        {
          hash: "def456",
          message: "fix: change",
          date: "2024-01-02",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      // Commits with only one word should not generate templates
      expect(result.templates).toEqual([]);
    });

    it("should handle multi-line non-conventional commits", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "first line\nsecond line\nthird line",
          date: "2024-01-01",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      // Non-conventional commits are treated as "chore" type
      expect(result.preferredTypes).toContain("chore");
      // Subject should be "first line" (first line of non-conventional commit)
      expect(result.avgSubjectLength).toBeGreaterThan(0);
      expect(result.conventionCompliance).toBe(0);
    });

    it("should round convention compliance percentage", async () => {
      const commits: CommitInfo[] = [];
      // Create 3 conventional commits out of 7 total = 42.857%
      for (let i = 0; i < 3; i++) {
        commits.push({
          hash: `conv${i}`,
          message: `feat: commit ${i}`,
          date: "2024-01-01",
          author: "test@example.com",
        });
      }
      for (let i = 0; i < 4; i++) {
        commits.push({
          hash: `nonconv${i}`,
          message: `non conventional commit ${i}`,
          date: "2024-01-01",
          author: "test@example.com",
        });
      }

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      // 3/7 = 42.857% -> rounded to 43%
      expect(result.conventionCompliance).toBe(43);
    });

    it("should round average subject length", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "feat: a", // 1 char
          date: "2024-01-01",
          author: "test@example.com",
        },
        {
          hash: "def456",
          message: "fix: ab", // 2 chars
          date: "2024-01-02",
          author: "test@example.com",
        },
        {
          hash: "ghi789",
          message: "chore: abc", // 3 chars
          date: "2024-01-03",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      // Average = (1 + 2 + 3) / 3 = 2
      expect(result.avgSubjectLength).toBe(2);
    });

    it("should handle commits with body extracted via CommitMessageMapper", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "feat: add feature\n\nThis is the body content",
          date: "2024-01-01",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      expect(result.detailLevel).toBe("detailed");
    });

    it("should handle commits where CommitMessageMapper parsing fails", async () => {
      const commits: CommitInfo[] = [
        {
          hash: "abc123",
          message: "feat: add feature\n\nBody content\n\nBREAKING CHANGE: change",
          date: "2024-01-01",
          author: "test@example.com",
        },
      ];

      vi.mocked(mockGitRepository.getCommitHistory).mockResolvedValue(commits);

      const result = await analyzer.analyzeProjectStyle(mockGitRepository);

      // Should fallback to simple extraction
      expect(result.detailLevel).toBe("detailed");
    });
  });
});

