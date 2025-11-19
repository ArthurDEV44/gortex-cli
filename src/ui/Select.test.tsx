import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Select, type SelectItem } from './Select.js';

describe('Select', () => {
  const mockItems: SelectItem[] = [
    { label: 'Option 1', value: 'opt1', description: 'First option' },
    { label: 'Option 2', value: 'opt2', description: 'Second option' },
    { label: 'Option 3', value: 'opt3' },
  ];

  it('should render with message and items', () => {
    const onSelect = vi.fn();
    const { lastFrame } = render(
      <Select message="Choose an option" items={mockItems} onSelect={onSelect} />
    );

    const output = lastFrame();
    expect(output).toContain('Choose an option');
    expect(output).toContain('Option 1');
    expect(output).toContain('Option 2');
    expect(output).toContain('Option 3');
  });

  it('should render description for initially selected item', () => {
    const onSelect = vi.fn();
    const { lastFrame } = render(
      <Select message="Choose" items={mockItems} onSelect={onSelect} />
    );

    const output = lastFrame();
    expect(output).toContain('First option');
  });

  it('should select first item by default', () => {
    const onSelect = vi.fn();
    const { lastFrame } = render(
      <Select message="Choose" items={mockItems} onSelect={onSelect} />
    );

    const output = lastFrame();
    expect(output).toContain('Option 1');
  });

  it('should use custom initial index', () => {
    const onSelect = vi.fn();
    const { lastFrame } = render(
      <Select message="Choose" items={mockItems} initialIndex={1} onSelect={onSelect} />
    );

    const output = lastFrame();
    expect(output).toContain('Second option');
  });

  it('should call onSelect with selected item on Enter', () => {
    const onSelect = vi.fn();
    const { stdin } = render(
      <Select message="Choose" items={mockItems} onSelect={onSelect} />
    );

    stdin.write('\r'); // Enter

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockItems[0]);
  });

  it('should show navigation instructions', () => {
    const onSelect = vi.fn();
    const { lastFrame } = render(
      <Select message="Choose" items={mockItems} onSelect={onSelect} />
    );

    const output = lastFrame();
    expect(output).toContain('navigate');
    expect(output).toContain('select');
    expect(output).toContain('vim keys');
  });

  it('should handle items without description', () => {
    const itemsNoDesc: SelectItem[] = [
      { label: 'Item 1', value: 'i1' },
      { label: 'Item 2', value: 'i2' },
    ];

    const onSelect = vi.fn();
    const { lastFrame } = render(
      <Select message="Choose" items={itemsNoDesc} onSelect={onSelect} />
    );

    const output = lastFrame();
    expect(output).toContain('Item 1');
    expect(output).toContain('Item 2');
  });

  it('should render all items in list', () => {
    const onSelect = vi.fn();
    const { lastFrame } = render(
      <Select message="Choose" items={mockItems} onSelect={onSelect} />
    );

    const output = lastFrame();
    mockItems.forEach(item => {
      expect(output).toContain(item.label);
    });
  });

  it('should accept stdin input without crashing', () => {
    const onSelect = vi.fn();
    const { stdin } = render(
      <Select message="Choose" items={mockItems} onSelect={onSelect} />
    );

    // Test various inputs don't crash
    expect(() => {
      stdin.write('\u001B[B'); // Down
      stdin.write('\u001B[A'); // Up
      stdin.write('j'); // Vim down
      stdin.write('k'); // Vim up
    }).not.toThrow();
  });
});
