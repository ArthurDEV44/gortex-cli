import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { Confirm } from './Confirm.js';

describe('Confirm', () => {
  it('should render with message', () => {
    const onSubmit = vi.fn();
    const { lastFrame } = render(
      <Confirm message="Are you sure?" onSubmit={onSubmit} />
    );

    const output = stripAnsi(lastFrame());
    expect(output).toContain('Are you sure?');
  });

  it('should show Yes/No options', () => {
    const onSubmit = vi.fn();
    const { lastFrame } = render(
      <Confirm message="Confirm?" onSubmit={onSubmit} />
    );

    const output = stripAnsi(lastFrame());
    expect(output).toContain('Yes');
    expect(output).toContain('No');
  });

  it('should default to Yes when defaultValue is true', () => {
    const onSubmit = vi.fn();
    const { lastFrame } = render(
      <Confirm message="Confirm?" defaultValue={true} onSubmit={onSubmit} />
    );

    const output = stripAnsi(lastFrame());
    expect(output).toContain('Yes');
  });

  it('should default to Yes when no defaultValue provided', () => {
    const onSubmit = vi.fn();
    const { lastFrame } = render(
      <Confirm message="Confirm?" onSubmit={onSubmit} />
    );

    const output = stripAnsi(lastFrame());
    expect(output).toContain('Yes');
  });

  it('should default to No when defaultValue is false', () => {
    const onSubmit = vi.fn();
    const { lastFrame } = render(
      <Confirm message="Confirm?" defaultValue={false} onSubmit={onSubmit} />
    );

    const output = lastFrame();
    expect(output).toContain('No');
  });

  it('should call onSubmit with true when confirming Yes', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <Confirm message="Confirm?" defaultValue={true} onSubmit={onSubmit} />
    );

    stdin.write('\r'); // Enter

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(true);
  });

  it('should call onSubmit with false when confirming No', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <Confirm message="Confirm?" defaultValue={false} onSubmit={onSubmit} />
    );

    stdin.write('\r'); // Enter

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(false);
  });

  it('should show navigation instructions', () => {
    const onSubmit = vi.fn();
    const { lastFrame } = render(
      <Confirm message="Confirm?" onSubmit={onSubmit} />
    );

    const output = lastFrame();
    expect(output).toContain('toggle');
    expect(output).toContain('y/n');
    expect(output).toContain('h/l');
    expect(output).toContain('vim');
    expect(output).toContain('confirm');
  });

  it('should accept toggle input without crashing', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <Confirm message="Confirm?" onSubmit={onSubmit} />
    );

    expect(() => {
      stdin.write('\u001B[D'); // Left
      stdin.write('\u001B[C'); // Right
      stdin.write('h'); // Vim left
      stdin.write('l'); // Vim right
    }).not.toThrow();
  });

  it('should accept direct y/n input without crashing', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <Confirm message="Confirm?" onSubmit={onSubmit} />
    );

    expect(() => {
      stdin.write('y'); // Yes
      stdin.write('n'); // No
      stdin.write('Y'); // Yes uppercase
      stdin.write('N'); // No uppercase
    }).not.toThrow();
  });

  it('should not submit on non-Enter keys', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <Confirm message="Confirm?" onSubmit={onSubmit} />
    );

    stdin.write('y'); // Set to yes
    stdin.write('n'); // Set to no
    stdin.write('h'); // Toggle
    stdin.write('l'); // Toggle

    // onSubmit should not have been called
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should handle rapid key presses without crashing', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <Confirm message="Confirm?" onSubmit={onSubmit} />
    );

    expect(() => {
      stdin.write('hlhlhlhl'); // Rapid toggles
    }).not.toThrow();
  });

  it('should only submit on Enter key', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <Confirm message="Confirm?" onSubmit={onSubmit} />
    );

    stdin.write('y'); // Should not submit
    expect(onSubmit).not.toHaveBeenCalled();

    stdin.write('\r'); // Should submit
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
