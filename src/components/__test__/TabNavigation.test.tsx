import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { TabNavigation } from '../TabNavigation.js';

describe('TabNavigation', () => {
  it('should render tabs', () => {
    const onTabChange = vi.fn();
    const { lastFrame } = render(
      <TabNavigation activeTab="commit" onTabChange={onTabChange} />
    );
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Commit');
    expect(output).toContain('Stats');
  });

  it('should highlight active tab', () => {
    const onTabChange = vi.fn();
    const { lastFrame } = render(
      <TabNavigation activeTab="commit" onTabChange={onTabChange} />
    );
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Commit');
  });

  it('should call onTabChange when right arrow is pressed', () => {
    const onTabChange = vi.fn();
    const { stdin } = render(
      <TabNavigation activeTab="commit" onTabChange={onTabChange} />
    );
    
    stdin.write('\u001B[C'); // Right arrow
    
    expect(onTabChange).toHaveBeenCalledWith('stats');
  });

  it('should call onTabChange when left arrow is pressed', () => {
    const onTabChange = vi.fn();
    const { stdin } = render(
      <TabNavigation activeTab="stats" onTabChange={onTabChange} />
    );
    
    stdin.write('\u001B[D'); // Left arrow
    
    expect(onTabChange).toHaveBeenCalledWith('commit');
  });

  it('should call onTabChange when Tab is pressed', () => {
    const onTabChange = vi.fn();
    const { stdin } = render(
      <TabNavigation activeTab="commit" onTabChange={onTabChange} />
    );
    
    stdin.write('\t'); // Tab
    
    expect(onTabChange).toHaveBeenCalledWith('stats');
  });

  it('should call onTabChange when "l" is pressed (vim style)', () => {
    const onTabChange = vi.fn();
    const { stdin } = render(
      <TabNavigation activeTab="commit" onTabChange={onTabChange} />
    );
    
    stdin.write('l');
    
    expect(onTabChange).toHaveBeenCalledWith('stats');
  });

  it('should call onTabChange when "h" is pressed (vim style)', () => {
    const onTabChange = vi.fn();
    const { stdin } = render(
      <TabNavigation activeTab="stats" onTabChange={onTabChange} />
    );
    
    stdin.write('h');
    
    expect(onTabChange).toHaveBeenCalledWith('commit');
  });

  it('should call onTabChange when "1" is pressed', () => {
    const onTabChange = vi.fn();
    const { stdin } = render(
      <TabNavigation activeTab="stats" onTabChange={onTabChange} />
    );
    
    stdin.write('1');
    
    expect(onTabChange).toHaveBeenCalledWith('commit');
  });

  it('should call onTabChange when "2" is pressed', () => {
    const onTabChange = vi.fn();
    const { stdin } = render(
      <TabNavigation activeTab="commit" onTabChange={onTabChange} />
    );
    
    stdin.write('2');
    
    expect(onTabChange).toHaveBeenCalledWith('stats');
  });

  it('should not call onTabChange when disabled', () => {
    const onTabChange = vi.fn();
    const { stdin } = render(
      <TabNavigation activeTab="commit" onTabChange={onTabChange} disabled={true} />
    );
    
    stdin.write('\t'); // Tab
    
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('should display active tab description', () => {
    const onTabChange = vi.fn();
    const { lastFrame } = render(
      <TabNavigation activeTab="commit" onTabChange={onTabChange} />
    );
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Create commits with AI or manually');
  });

  it('should display navigation help', () => {
    const onTabChange = vi.fn();
    const { lastFrame } = render(
      <TabNavigation activeTab="commit" onTabChange={onTabChange} />
    );
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('switch tabs');
  });

  it('should wrap around when navigating from last to first tab', () => {
    const onTabChange = vi.fn();
    const { stdin } = render(
      <TabNavigation activeTab="stats" onTabChange={onTabChange} />
    );
    
    stdin.write('\t'); // Tab from stats should go to commit
    
    expect(onTabChange).toHaveBeenCalledWith('commit');
  });

  it('should wrap around when navigating from first to last tab', () => {
    const onTabChange = vi.fn();
    const { stdin } = render(
      <TabNavigation activeTab="commit" onTabChange={onTabChange} />
    );
    
    stdin.write('\u001B[D'); // Left arrow from commit should go to stats
    
    expect(onTabChange).toHaveBeenCalledWith('stats');
  });
});

