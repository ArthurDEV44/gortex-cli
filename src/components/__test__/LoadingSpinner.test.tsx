import { describe, expect, it } from "vitest";
import React from "react";
import { render } from "ink-testing-library";
import { LoadingSpinner } from "../LoadingSpinner.js";

describe("LoadingSpinner", () => {
  it("should render default message", () => {
    const { lastFrame } = render(<LoadingSpinner />);
    expect(lastFrame()).toContain("Loading...");
  });

  it("should render custom message", () => {
    const { lastFrame } = render(<LoadingSpinner message="Processing..." />);
    expect(lastFrame()).toContain("Processing...");
  });

  it("should render with primary variant by default", () => {
    const { lastFrame } = render(<LoadingSpinner />);
    const output = lastFrame() || "";
    expect(output).toContain("Loading...");
  });

  it("should render with success variant", () => {
    const { lastFrame } = render(<LoadingSpinner variant="success" />);
    const output = lastFrame() || "";
    expect(output).toContain("Loading...");
  });

  it("should render with warning variant", () => {
    const { lastFrame } = render(<LoadingSpinner variant="warning" />);
    const output = lastFrame() || "";
    expect(output).toContain("Loading...");
  });

  it("should render spinner with custom message and variant", () => {
    const { lastFrame } = render(
      <LoadingSpinner message="Saving..." variant="success" />,
    );
    expect(lastFrame()).toContain("Saving...");
  });
});
