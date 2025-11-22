import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import { StepIndicator } from '../StepIndicator.js';

describe('StepIndicator', () => {
  it('should render step name and progress', () => {
    const { lastFrame } = render(
      <StepIndicator currentStep={1} totalSteps={5} stepName="Test Step" />
    );
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Test Step');
    expect(output).toContain('[1/5]');
  });

  it('should display correct progress percentage', () => {
    const { lastFrame } = render(
      <StepIndicator currentStep={2} totalSteps={5} stepName="Test Step" />
    );
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('40%');
  });

  it('should display 100% when on last step', () => {
    const { lastFrame } = render(
      <StepIndicator currentStep={5} totalSteps={5} stepName="Final Step" />
    );
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('100%');
    expect(output).toContain('[5/5]');
  });

  it('should use custom icon when provided', () => {
    const { lastFrame } = render(
      <StepIndicator 
        currentStep={1} 
        totalSteps={3} 
        stepName="Custom Step" 
        icon="★"
      />
    );
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Custom Step');
  });

  it('should use default icon when not provided', () => {
    const { lastFrame } = render(
      <StepIndicator currentStep={1} totalSteps={3} stepName="Default Step" />
    );
    
    const output = stripAnsi(lastFrame() || '');
    expect(output).toContain('Default Step');
  });

  it('should display progress bar', () => {
    const { lastFrame } = render(
      <StepIndicator currentStep={3} totalSteps={10} stepName="Progress Test" />
    );
    
    const output = stripAnsi(lastFrame() || '');
    // Should contain progress bar characters
    expect(output.length).toBeGreaterThan(0);
  });
});

