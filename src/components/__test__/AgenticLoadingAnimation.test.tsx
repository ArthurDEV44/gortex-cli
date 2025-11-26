import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { AgenticLoadingAnimation } from '../AgenticLoadingAnimation.js';

describe('AgenticLoadingAnimation', () => {
  it('should render default message', () => {
    const { lastFrame } = render(<AgenticLoadingAnimation />);
    const output = stripAnsi(lastFrame() || '');
    // The message is rendered with a gradient and an arrow prefix, so we check for the base text
    expect(output).toContain('Loading...');
  });

  it('should render custom message', () => {
    const { lastFrame } = render(<AgenticLoadingAnimation message="Processing..." />);
    const output = stripAnsi(lastFrame() || '');
    // The message is rendered with a gradient and an arrow prefix, so we check for the base text
    expect(output).toContain('Processing...');
  });

  it('should render with primary variant by default', () => {
    const { lastFrame } = render(<AgenticLoadingAnimation />);
    const output = stripAnsi(lastFrame() || '');
    // The message is rendered with a gradient and an arrow prefix, so we check for the base text
    expect(output).toContain('Loading...');
  });

  it('should render with success variant', () => {
    const { lastFrame } = render(<AgenticLoadingAnimation variant="success" />);
    const output = stripAnsi(lastFrame() || '');
    // The message is rendered with a gradient and an arrow prefix, so we check for the base text
    expect(output).toContain('Loading...');
  });

  it('should render with warning variant', () => {
    const { lastFrame } = render(<AgenticLoadingAnimation variant="warning" />);
    const output = stripAnsi(lastFrame() || '');
    // The message is rendered with a gradient and an arrow prefix, so we check for the base text
    expect(output).toContain('Loading...');
  });

  it('should render animation with custom message and variant', () => {
    const { lastFrame } = render(
      <AgenticLoadingAnimation message="Saving..." variant="success" />
    );
    const output = stripAnsi(lastFrame() || '');
    // The message is rendered with a gradient and an arrow prefix, so we check for the base text
    expect(output).toContain('Saving...');
  });
});

