import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { SuccessMessage } from '../SuccessMessage.js';

describe('SuccessMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render immediately (has delay)', () => {
    const { lastFrame } = render(<SuccessMessage title="Success!" />);
    // Before delay, should return null
    expect(lastFrame()).toBe('');
  });

  it('should render title after delay', async () => {
    const { lastFrame } = render(<SuccessMessage title="Success!" />);
    
    // Initially should not render
    expect(lastFrame()).toBe('');
    
    // Advance timers to trigger the useEffect
    await vi.runOnlyPendingTimersAsync();
    
    // After delay, should render
    const frame = stripAnsi(lastFrame() || '');
    expect(frame).toContain('Success!');
  });

  it('should render subtitle when provided', async () => {
    const { lastFrame } = render(
      <SuccessMessage title="Success!" subtitle="Operation completed" />
    );
    
    await vi.runOnlyPendingTimersAsync();
    
    const frame = stripAnsi(lastFrame() || '');
    expect(frame).toContain('Success!');
    expect(frame).toContain('Operation completed');
  });

  it('should render details when provided', async () => {
    const details = ['Detail 1', 'Detail 2', 'Detail 3'];
    const { lastFrame } = render(
      <SuccessMessage title="Success!" details={details} />
    );
    
    await vi.runOnlyPendingTimersAsync();
    
    const frame = stripAnsi(lastFrame() || '');
    expect(frame).toContain('Success!');
    expect(frame).toContain('Detail 1');
    expect(frame).toContain('Detail 2');
    expect(frame).toContain('Detail 3');
  });

  it('should render custom icon when provided', async () => {
    const { lastFrame } = render(
      <SuccessMessage title="Success!" icon="✓" />
    );
    
    await vi.runOnlyPendingTimersAsync();
    
    const frame = stripAnsi(lastFrame() || '');
    expect(frame).toContain('Success!');
  });

  it('should render all props together', async () => {
    const details = ['Step 1', 'Step 2'];
    const { lastFrame } = render(
      <SuccessMessage
        title="Complete!"
        subtitle="All done"
        details={details}
        icon="✓"
      />
    );
    
    await vi.runOnlyPendingTimersAsync();
    
    const frame = stripAnsi(lastFrame() || '');
    expect(frame).toContain('Complete!');
    expect(frame).toContain('All done');
    expect(frame).toContain('Step 1');
    expect(frame).toContain('Step 2');
  });

  it('should cleanup timer on unmount', () => {
    const { unmount } = render(<SuccessMessage title="Test" />);
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
    vi.advanceTimersByTime(150);
  });
});

