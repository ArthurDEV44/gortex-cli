import chalk from "chalk";
import { colors, createGradient, icons } from "../src/theme/colors.js";

console.log(
  `\n${createGradient.titanium(" GORTEX CLI - THEME VERIFICATION ")}\n`,
);

console.log(chalk.bold("1. Base Palette (Titanium)"));
console.log(chalk.hex(colors.foreground)("  Foreground (White)"));
console.log(chalk.hex(colors.mutedLight)("  Muted Light (Titanium 200)"));
console.log(chalk.hex(colors.muted)("  Muted (Titanium 300)"));
console.log(chalk.hex(colors.mutedDark)("  Muted Dark (Titanium 400)"));
console.log(
  chalk.hex(colors.background)(
    "  Background (Titanium 500) - (Might be invisible on dark terminal)",
  ),
);

console.log(`\n${chalk.bold("2. Accent Palette (Gradients)")}`);
console.log(createGradient.flow("  Flow Gradient (Blue -> Indigo)"));
console.log(createGradient.nebula("  Nebula Gradient (Purple -> Rose)"));
console.log(createGradient.aurora("  Aurora Gradient (Blue -> Purple)"));
console.log(
  createGradient.titanium("  Titanium Gradient (White -> Titanium 300)"),
);

console.log(`\n${chalk.bold("3. Semantic Mapping")}`);
console.log(chalk.hex(colors.success)(`  ${icons.success} Success (Purple)`));
console.log(chalk.hex(colors.error)(`  ${icons.error} Error (Rose)`));
console.log(chalk.hex(colors.warning)(`  ${icons.warning} Warning (Indigo)`));
console.log(chalk.hex(colors.info)(`  ${icons.info} Info (Blue)`));

console.log(`\n${chalk.bold("4. UI Elements")}`);
console.log(chalk.hex(colors.border)(`  ${icons.separator.repeat(20)}`));
console.log(chalk.hex(colors.primary)("  Primary Action Button"));
console.log(chalk.hex(colors.secondary)("  Secondary Action Button"));

console.log(`\n${chalk.bold("5. Commit Types")}`);
console.log(chalk.hex(colors.success)("  feat: New Feature"));
console.log(chalk.hex(colors.error)("  fix: Bug Fix"));
console.log(chalk.hex(colors.info)("  docs: Documentation"));

console.log("\n");
