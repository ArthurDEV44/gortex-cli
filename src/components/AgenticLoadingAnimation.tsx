import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { createGradient } from "../theme/colors.js";

/**
 * Agentic Loading Animation - Dark Matter Orb
 *
 * Premium dark matter orb animation specifically designed for the Agentic AI workflow.
 * Features an elegant, organic sphere with realistic depth and vibrant GORTEX colors.
 *
 * Design Characteristics:
 * - Vibrant gradient aesthetic (blue → indigo → purple → rose)
 * - Organic energy flow with 8-frame smooth animation
 * - Elegant spherical form with depth layering
 * - Immersive 3D effect using gradient shading
 * - Smooth rotation suggesting dynamic AI thinking
 *
 * This component is exclusive to the AgenticAICommitGenerator and represents
 * the "thinking" state of the AI during reflection and refinement phases.
 *
 * @see LoadingSpinner for standard loading states in other components
 */
interface AgenticLoadingAnimationProps {
  message?: string;
  variant?: "primary" | "success" | "warning";
}

/**
 * Dark Matter Orb - 8-Frame Animation
 *
 * Elegant organic sphere with deep dark matter aesthetic.
 * Each frame shows energy flow and subtle rotation with realistic depth.
 *
 * Characters used:
 * ░ (U+2591) - Light shade (outer glow, ambient light)
 * ▒ (U+2592) - Medium shade (transitional depth)
 * ▓ (U+2593) - Dark shade (core matter, deep surface)
 * █ (U+2588) - Full block (deepest core, maximum density)
 * ● (U+25CF) - Black circle (energy focal points)
 * ◉ (U+25C9) - Fisheye (highlight/reflection points)
 * ○ (U+25CB) - White circle (bright highlights)
 */
const darkMatterOrb = [
  // Frame 1 - Front view with subtle highlight (top-left light source)
  [
    "                          ",
    "       ░░▓▓░░             ",
    "     ░░▓████▓░░           ",
    "     ░▓███▓▓███▓░         ",
    "    ░▓██▓░░░▓██▓░         ",
    "     ░▓███▓▓███▓░         ",
    "     ░░▓████▓░░           ",
    "       ░░▓▓░░             ",
    "                          ",
  ],
  // Frame 2 - Rotation with energy flow (highlight shifts)
  [
    "                          ",
    "      ░▓▓▓░░░             ",
    "    ░▓████▓▓░░            ",
    "    ░▓███▓░▓███▓░         ",
    "    ▓██▓░░░░▓██▓░         ",
    "    ░▓███▓░▓███▓░         ",
    "    ░░▓████▓▓░░           ",
    "      ░░░▓▓▓░             ",
    "                          ",
  ],
  // Frame 3 - Mid-rotation, deeper shadows
  [
    "                          ",
    "      ▓▓▓▓░░░             ",
    "    ▓████▓▓░░░            ",
    "    ▓███▓░░▓███▓░         ",
    "    ██▓░░░░░▓███░         ",
    "    ▓███▓░░▓███▓░         ",
    "    ▓████▓▓░░░            ",
    "      ▓▓▓▓░░░             ",
    "                          ",
  ],
  // Frame 4 - Profile with energy band
  [
    "                          ",
    "      ░░░▓▓▓▓             ",
    "    ░░░▓▓████▓            ",
    "    ░▓███▓░▓███▓          ",
    "    ░███▓░░░░▓██          ",
    "    ░▓███▓░▓███▓          ",
    "    ░░░▓▓████▓            ",
    "      ░░░▓▓▓▓             ",
    "                          ",
  ],
  // Frame 5 - Back view, minimal highlights
  [
    "                          ",
    "      ░░░░▓▓░░            ",
    "    ░░░▓▓▓▓▓▓░░           ",
    "    ░░▓███▓▓███▓░░        ",
    "    ░▓██▓░░░▓██▓░         ",
    "    ░░▓███▓▓███▓░░        ",
    "    ░░░▓▓▓▓▓▓░░           ",
    "      ░░░▓▓░░             ",
    "                          ",
  ],
  // Frame 6 - Return rotation, highlight emerging (bottom-right)
  [
    "                          ",
    "      ░░░▓▓▓░             ",
    "    ░░▓▓████▓░            ",
    "    ░▓███▓░███▓▓          ",
    "    ░██▓░░░░▓██▓          ",
    "    ░▓███▓░███▓▓          ",
    "    ░░▓▓████▓░            ",
    "      ░░░▓▓▓░             ",
    "                          ",
  ],
  // Frame 7 - Near completion, bright highlight returns
  [
    "                          ",
    "      ░░▓▓▓░░             ",
    "    ░▓████▓░░░            ",
    "    ░▓███▓▓███▓░          ",
    "    ▓██▓░░░▓██▓░          ",
    "    ░▓███▓▓███▓░          ",
    "    ░▓████▓░░░            ",
    "      ░░▓▓▓░░             ",
    "                          ",
  ],
  // Frame 8 - Final frame, highlight at top (loop ready)
  [
    "                          ",
    "       ░▓▓░░░             ",
    "     ░▓███▓░░░            ",
    "     ░▓███▓███▓░          ",
    "    ░▓██▓░░▓██▓░          ",
    "     ░▓███▓███▓░          ",
    "     ░▓███▓░░░            ",
    "       ░▓▓░░░             ",
    "                          ",
  ],
];

/**
 * Vibrant Gradient - Original GORTEX Colors
 *
 * Beautiful gradient matching the commit message colors:
 * Blue → Indigo → Purple → Rose
 *
 * Creates an elegant, colorful orb with positive, vibrant energy.
 */
const vibrantGradient = [
  "#6BA8E8", // Info, Primaire - Bleu pastel doux
  "#8A9EE8", // Focus, Secondaire - Indigo lavande
  "#B5A5DD", // Succès, Highlights - Violet pastel
  "#E09DAA", // Erreur, Warning - Rose poudré
];

export const AgenticLoadingAnimation = ({
  message = "Loading...",
  variant: _variant = "primary", // Reserved for future color variations
}: AgenticLoadingAnimationProps) => {
  const [frameIndex, setFrameIndex] = useState(0);

  // Note: variant parameter is reserved for future enhancements (color variations)
  // Currently, the animation uses the vibrant GORTEX gradient for consistency

  useEffect(() => {
    // Slightly slower animation (400ms) for more contemplative, weighty feel
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % darkMatterOrb.length);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const currentFrame = darkMatterOrb[frameIndex];

  /**
   * Simple gradient color mapping from top to bottom
   * Maps each line to the vibrant gradient colors
   */
  const getGradientColor = (lineIndex: number, totalLines: number) => {
    const position = lineIndex / totalLines;
    const colorIndex = Math.min(
      Math.floor(position * vibrantGradient.length),
      vibrantGradient.length - 1,
    );
    return vibrantGradient[colorIndex];
  };

  return (
    <Box flexDirection="column" alignItems="center">
      {/* Dark Matter Orb with vibrant GORTEX gradient */}
      <Box flexDirection="column" marginBottom={1}>
        {currentFrame.map((line, index) => (
          <Text
            key={index}
            color={getGradientColor(index, currentFrame.length)}
          >
            {line}
          </Text>
        ))}
      </Box>

      {/* Message with elegant shimmer gradient */}
      {message && (
        <Box>
          <Text>{createGradient.shimmer(`▸ ${message}`)}</Text>
        </Box>
      )}
    </Box>
  );
};
