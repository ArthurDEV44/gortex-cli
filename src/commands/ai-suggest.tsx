import chalk from "chalk";
import { commitCommand } from "./commit.js";

/**
 * Commande pour suggérer un message de commit avec AI
 * @deprecated Utilisez plutôt `gortex commit` qui intègre maintenant l'AI dans son workflow
 */
export async function aiSuggestCommand(): Promise<void> {
  // Show deprecation warning
  console.log(
    chalk.yellow("⚠️  DÉPRÉCIATION: Cette commande est maintenant obsolète."),
  );
  console.log(
    chalk.dim(
      "La génération AI est maintenant intégrée dans le workflow principal.",
    ),
  );
  console.log(
    chalk.cyan("\n💡 Redirection vers: ") + chalk.bold("gortex commit"),
  );
  console.log(
    chalk.dim("   Vous pourrez choisir entre AI et manuel lors du workflow.\n"),
  );

  // Petit délai pour que l'utilisateur puisse lire le message
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Rediriger vers la commande commit qui utilise maintenant DI
  await commitCommand();
}
