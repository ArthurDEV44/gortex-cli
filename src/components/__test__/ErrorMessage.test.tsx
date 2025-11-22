import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { ErrorMessage } from '../ErrorMessage.js';

describe('ErrorMessage', () => {
  it('should render title', () => {
    const { lastFrame } = render(<ErrorMessage title="Test Error" />);
    expect(lastFrame()).toContain('Test Error');
  });

  it('should render message when provided', () => {
    const { lastFrame } = render(
      <ErrorMessage title="Test Error" message="This is a test message" />
    );
    expect(lastFrame()).toContain('Test Error');
    expect(lastFrame()).toContain('This is a test message');
  });

  it('should render suggestions when provided', () => {
    const suggestions = ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'];
    const { lastFrame } = render(
      <ErrorMessage title="Test Error" suggestions={suggestions} />
    );
    expect(lastFrame()).toContain('Test Error');
    expect(lastFrame()).toContain('Suggestions:');
    expect(lastFrame()).toContain('Suggestion 1');
    expect(lastFrame()).toContain('Suggestion 2');
    expect(lastFrame()).toContain('Suggestion 3');
  });

  it('should render all props together', () => {
    const suggestions = ['Fix 1', 'Fix 2'];
    const { lastFrame } = render(
      <ErrorMessage
        title="Error Title"
        message="Error message"
        suggestions={suggestions}
      />
    );
    expect(lastFrame()).toContain('Error Title');
    expect(lastFrame()).toContain('Error message');
    expect(lastFrame()).toContain('Suggestions:');
    expect(lastFrame()).toContain('Fix 1');
    expect(lastFrame()).toContain('Fix 2');
  });

  it('should not render message when not provided', () => {
    const { lastFrame } = render(<ErrorMessage title="Test Error" />);
    const output = lastFrame() || '';
    // Should not contain "undefined" or empty message
    expect(output).not.toContain('undefined');
  });

  it('should not render suggestions section when empty array', () => {
    const { lastFrame } = render(
      <ErrorMessage title="Test Error" suggestions={[]} />
    );
    const output = lastFrame() || '';
    expect(output).toContain('Test Error');
    // Should not show suggestions section if empty
  });
});

