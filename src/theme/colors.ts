import gradient from 'gradient-string';

// Premium color palette
export const colors = {
  primary: '#6366f1',      // Indigo
  secondary: '#8b5cf6',    // Purple
  success: '#10b981',      // Emerald
  error: '#ef4444',        // Red
  warning: '#f59e0b',      // Amber
  info: '#3b82f6',         // Blue

  // Gradients
  gradients: {
    primary: ['#6366f1', '#8b5cf6', '#d946ef'],
    success: ['#10b981', '#3b82f6'],
    fire: ['#f59e0b', '#ef4444'],
    ocean: ['#06b6d4', '#3b82f6', '#6366f1'],
    aurora: ['#10b981', '#3b82f6', '#8b5cf6', '#d946ef'],
  }
};

// Gradient creators
export const createGradient = {
  primary: gradient(colors.gradients.primary) as any,
  success: gradient(colors.gradients.success) as any,
  fire: gradient(colors.gradients.fire) as any,
  ocean: gradient(colors.gradients.ocean) as any,
  aurora: gradient(colors.gradients.aurora) as any,
};

// Box styles
export const boxStyles = {
  rounded: 'round' as const,
  bold: 'bold' as const,
  single: 'single' as const,
  double: 'double' as const,
  classic: 'classic' as const,
};

// Icons
export const icons = {
  success: '✓',
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
  rocket: '🚀',
  sparkles: '✨',
  fire: '🔥',
  target: '🎯',
  package: '📦',
  branch: '🌿',
  commit: '💾',
  push: '⬆️',
  pull: '⬇️',
  merge: '🔀',
  check: '✅',
  cross: '❌',
  gear: '⚙️',
  lock: '🔒',
  key: '🔑',
  star: '⭐',
  lightning: '⚡',
  crown: '👑',
};
