import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { FileDiffPreview } from '../FileDiffPreview.js';

describe('FileDiffPreview', () => {
  it('should render file list', () => {
    const files = [
      { path: 'src/file1.ts', status: 'modifié' },
      { path: 'src/file2.ts', status: 'nouveau' },
    ];
    
    const { lastFrame } = render(<FileDiffPreview files={files} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Changed Files');
    expect(output).toContain('(2 total)');
    expect(output).toContain('file1.ts');
    expect(output).toContain('file2.ts');
  });

  it('should display correct status icons', () => {
    const files = [
      { path: 'src/file1.ts', status: 'nouveau' },
      { path: 'src/file2.ts', status: 'modifié' },
      { path: 'src/file3.ts', status: 'supprimé' },
    ];
    
    const { lastFrame } = render(<FileDiffPreview files={files} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('nouveau');
    expect(output).toContain('modifié');
    expect(output).toContain('supprimé');
  });

  it('should limit displayed files to maxDisplay', () => {
    const files = Array.from({ length: 10 }, (_, i) => ({
      path: `src/file${i}.ts`,
      status: 'modifié',
    }));
    
    const { lastFrame } = render(<FileDiffPreview files={files} maxDisplay={5} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('(10 total)');
    expect(output).toContain('... and 5 more files');
  });

  it('should use default maxDisplay of 5', () => {
    const files = Array.from({ length: 7 }, (_, i) => ({
      path: `src/file${i}.ts`,
      status: 'modifié',
    }));
    
    const { lastFrame } = render(<FileDiffPreview files={files} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('... and 2 more files');
  });

  it('should not show "more files" message when files count is less than maxDisplay', () => {
    const files = [
      { path: 'src/file1.ts', status: 'modifié' },
      { path: 'src/file2.ts', status: 'nouveau' },
    ];
    
    const { lastFrame } = render(<FileDiffPreview files={files} maxDisplay={5} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).not.toContain('more file');
  });

  it('should handle empty file list', () => {
    const { lastFrame } = render(<FileDiffPreview files={[]} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Changed Files');
    expect(output).toContain('(0 total)');
  });

  it('should handle singular "more file" correctly', () => {
    const files = Array.from({ length: 6 }, (_, i) => ({
      path: `src/file${i}.ts`,
      status: 'modifié',
    }));
    
    const { lastFrame } = render(<FileDiffPreview files={files} maxDisplay={5} />);
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('... and 1 more file');
    expect(output).not.toContain('more files');
  });
});

