import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { Brand } from '../Brand.js';

describe('Brand', () => {
  it('should render small variant by default', () => {
    const { lastFrame } = render(<Brand />);
    const output = stripAnsi(lastFrame() || '');
    // Check for ASCII art logo characters and tagline
    expect(output).toContain('╔');
    expect(output).toContain('Git Workflow CLI');
  });

  it('should render small variant when specified', () => {
    const { lastFrame } = render(<Brand variant="small" />);
    const output = stripAnsi(lastFrame() || '');
    // Check for ASCII art logo characters and tagline
    expect(output).toContain('╔');
    expect(output).toContain('Git Workflow CLI');
  });

  it('should render large variant', () => {
    const { lastFrame } = render(<Brand variant="large" />);
    const output = stripAnsi(lastFrame() || '');
    // Check for ASCII art logo characters
    expect(output).toContain('╔');
    expect(output).toContain('█');
  });

  it('should render tagline when tagline prop is true in large variant', () => {
    const { lastFrame } = render(<Brand variant="large" tagline={true} />);
    const output = stripAnsi(lastFrame() || '');
    // Check for ASCII art logo characters
    expect(output).toContain('╔');
    // Tagline should be present
    expect(output).toContain('Git Workflow, Elevated');
  });

  it('should not render tagline when tagline prop is false in large variant', () => {
    const { lastFrame } = render(<Brand variant="large" tagline={false} />);
    const output = stripAnsi(lastFrame() || '');
    // Check for ASCII art logo characters
    expect(output).toContain('╔');
    // Tagline should not be present
    expect(output).not.toContain('Git Workflow, Elevated');
  });

  it('should not render tagline in small variant even if tagline prop is true', () => {
    const { lastFrame } = render(<Brand variant="small" tagline={true} />);
    const output = stripAnsi(lastFrame() || '');
    // Check for ASCII art logo characters
    expect(output).toContain('╔');
    // In small variant, tagline is not shown (only "Git Workflow CLI" is shown)
    expect(output).toContain('Git Workflow CLI');
    expect(output).not.toContain('Git Workflow, Elevated');
  });
});

