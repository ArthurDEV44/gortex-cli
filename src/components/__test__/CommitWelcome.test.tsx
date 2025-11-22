import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { CommitWelcome } from '../CommitWelcome.js';

describe('CommitWelcome', () => {
  it('should render welcome message', () => {
    const onStart = vi.fn();
    const { lastFrame } = render(<CommitWelcome onStart={onStart} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Create a Conventional Commit');
    expect(output).toContain('Select or create a branch');
    expect(output).toContain('Choose files to stage');
    expect(output).toContain('Generate commit message');
    expect(output).toContain('Confirm and commit');
    expect(output).toContain('Push to remote');
  });

  it('should call onStart when Enter is pressed', () => {
    const onStart = vi.fn();
    const { stdin } = render(<CommitWelcome onStart={onStart} />);
    
    stdin.write('\r');
    
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('should call onStart when Space is pressed', () => {
    const onStart = vi.fn();
    const { stdin } = render(<CommitWelcome onStart={onStart} />);
    
    stdin.write(' ');
    
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('should display instructions', () => {
    const onStart = vi.fn();
    const { lastFrame } = render(<CommitWelcome onStart={onStart} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Press Enter or Space to start');
    expect(output).toContain('You can switch to the Stats tab');
  });

  it('should display workflow steps', () => {
    const onStart = vi.fn();
    const { lastFrame } = render(<CommitWelcome onStart={onStart} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Select or create a branch');
    expect(output).toContain('Choose files to stage');
    expect(output).toContain('Generate commit message');
    expect(output).toContain('Confirm and commit');
    expect(output).toContain('Push to remote');
  });
});

