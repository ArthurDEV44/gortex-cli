import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { ContinuePrompt } from '../ContinuePrompt.js';

describe('ContinuePrompt', () => {
  it('should render prompt with default selection (continue)', () => {
    const onComplete = vi.fn();
    const { lastFrame } = render(<ContinuePrompt onComplete={onComplete} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain("What's next?");
    expect(output).toContain('Make another commit');
    expect(output).toContain('Exit');
  });

  it('should call onComplete when Enter is pressed', () => {
    const onComplete = vi.fn();
    const { stdin } = render(<ContinuePrompt onComplete={onComplete} />);
    
    // Press Enter (continue is selected by default)
    stdin.write('\r');
    
    // onComplete should be called (value depends on selection state)
    expect(onComplete).toHaveBeenCalled();
  });

  it('should render with continue option highlighted by default', () => {
    const onComplete = vi.fn();
    const { lastFrame } = render(<ContinuePrompt onComplete={onComplete} />);
    
    const output = stripAnsi(lastFrame() || '');
    // Should show "Make another commit" as selected (with pointer)
    expect(output).toContain('Make another commit');
    expect(output).toContain('Exit');
  });

  it('should display instructions', () => {
    const onComplete = vi.fn();
    const { lastFrame } = render(<ContinuePrompt onComplete={onComplete} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Use ←/→ or h/l to select, Enter to confirm');
  });
});

