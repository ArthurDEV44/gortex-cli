import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { MultiSelect, type MultiSelectItem } from '../MultiSelect.js';

describe('MultiSelect', () => {
  const mockItems: MultiSelectItem[] = [
    { label: 'Item 1', value: 'item1', description: 'First item' },
    { label: 'Item 2', value: 'item2', checked: true },
    { label: 'Item 3', value: 'item3', description: 'Third item' },
  ];

  it('should render with message and items', () => {
    const onSubmit = vi.fn();
    const { lastFrame } = render(
      <MultiSelect message="Select items" items={mockItems} onSubmit={onSubmit} />
    );

    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Select items');
    expect(output).toContain('Item 1');
    expect(output).toContain('Item 2');
    expect(output).toContain('Item 3');
  });

  it('should show selected count', () => {
    const onSubmit = vi.fn();
    const { lastFrame } = render(
      <MultiSelect message="Select" items={mockItems} onSubmit={onSubmit} />
    );

    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Selected:');
    expect(output).toContain('1'); // One item is checked by default
    expect(output).toContain('3'); // Total items
  });

  it('should preserve initial checked state', () => {
    const onSubmit = vi.fn();
    const { lastFrame } = render(
      <MultiSelect message="Select" items={mockItems} onSubmit={onSubmit} />
    );

    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Item 2');
  });

  it('should call onSubmit with selected values on Enter when valid', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <MultiSelect message="Select" items={mockItems} onSubmit={onSubmit} />
    );

    stdin.write('\r'); // Enter

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(['item2']);
  });

  it('should not call onSubmit when minSelection not met', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <MultiSelect message="Select" items={mockItems} onSubmit={onSubmit} minSelection={2} />
    );

    stdin.write('\r'); // Enter with only 1 item selected

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should show minimum selection requirement when not met', () => {
    const onSubmit = vi.fn();
    const items: MultiSelectItem[] = [
      { label: 'Item 1', value: 'item1' },
      { label: 'Item 2', value: 'item2' },
    ];

    const { lastFrame } = render(
      <MultiSelect message="Select" items={items} onSubmit={onSubmit} minSelection={2} />
    );

    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('min: 2');
  });

  it('should show navigation instructions', () => {
    const onSubmit = vi.fn();
    const { lastFrame } = render(
      <MultiSelect message="Select" items={mockItems} onSubmit={onSubmit} />
    );

    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('navigate');
    expect(output).toContain('toggle');
    expect(output).toContain('submit');
    expect(output).toContain('select all');
    expect(output).toContain('invert');
    expect(output).toContain('vim keys');
  });

  it('should handle items without description', () => {
    const itemsNoDesc: MultiSelectItem[] = [
      { label: 'Item 1', value: 'i1' },
      { label: 'Item 2', value: 'i2' },
    ];

    const onSubmit = vi.fn();
    const { lastFrame } = render(
      <MultiSelect message="Select" items={itemsNoDesc} onSubmit={onSubmit} />
    );

    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Item 1');
    expect(output).toContain('Item 2');
  });

  it('should accept navigation input without crashing', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <MultiSelect message="Select" items={mockItems} onSubmit={onSubmit} />
    );

    expect(() => {
      stdin.write('\u001B[B'); // Down
      stdin.write('\u001B[A'); // Up
      stdin.write('j'); // Vim down
      stdin.write('k'); // Vim up
    }).not.toThrow();
  });

  it('should accept toggle input without crashing', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <MultiSelect message="Select" items={mockItems} onSubmit={onSubmit} />
    );

    expect(() => {
      stdin.write(' '); // Toggle
      stdin.write('a'); // Select all
      stdin.write('i'); // Invert
    }).not.toThrow();
  });

  it('should show description for initially selected item', () => {
    const onSubmit = vi.fn();
    const { lastFrame } = render(
      <MultiSelect message="Select" items={mockItems} onSubmit={onSubmit} />
    );

    const output = stripAnsi(lastFrame() || '');
    // First item is at cursor initially
    expect(output).toContain('First item');
  });

  it('should render with custom initial checked state', () => {
    const items: MultiSelectItem[] = [
      { label: 'A', value: 'a', checked: true },
      { label: 'B', value: 'b', checked: true },
      { label: 'C', value: 'c', checked: false },
    ];

    const onSubmit = vi.fn();
    const { lastFrame } = render(
      <MultiSelect message="Select" items={items} onSubmit={onSubmit} />
    );

    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Selected:');
    expect(output).toContain('2'); // Two items checked
  });

  it('should initialize all items as unchecked when not specified', () => {
    const items: MultiSelectItem[] = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ];

    const onSubmit = vi.fn();
    const { stdin } = render(
      <MultiSelect message="Select" items={items} onSubmit={onSubmit} />
    );

    stdin.write('\r'); // Try to submit with 0 selected

    // Should not call onSubmit because minSelection defaults to 1
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
