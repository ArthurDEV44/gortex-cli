import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import { Octokit } from '@octokit/rest';
import { getCredentialStore, saveCredentials, clearCredentials, type StoredCredentials } from './credential-store.js';

// GitHub OAuth App Client ID pour Gortex CLI
// Peut être configuré via la variable d'environnement GORTEX_GITHUB_CLIENT_ID
// Pour créer votre propre OAuth App, voir SETUP_GITHUB_OAUTH.md
const GITHUB_CLIENT_ID = process.env.GORTEX_GITHUB_CLIENT_ID || 'Ov23li23yvkwyWAxpISZ'; // Placeholder

export interface DeviceFlowResult {
  verification_uri: string;
  user_code: string;
  device_code: string;
  expires_in: number;
  interval: number;
}

export interface GitHubAuthResult {
  token: string;
  username: string;
  email: string;
}

/**
 * Authentification GitHub Device Flow complète
 */
export async function authenticateWithDeviceFlow(
  onVerification: (verification: DeviceFlowResult) => void
): Promise<GitHubAuthResult> {
  // Vérifier que le Client ID est configuré
  if (!GITHUB_CLIENT_ID || GITHUB_CLIENT_ID === 'Ov23li23yvkwyWAxpISZ') {
    throw new Error(
      'GitHub OAuth Client ID not configured. Please set GORTEX_GITHUB_CLIENT_ID environment variable or see SETUP_GITHUB_OAUTH.md'
    );
  }

  const auth = createOAuthDeviceAuth({
    clientType: 'oauth-app',
    clientId: GITHUB_CLIENT_ID,
    scopes: ['repo', 'user:email'],
    onVerification: (verification) => {
      // Appeler le callback avec les infos de vérification
      onVerification({
        verification_uri: verification.verification_uri,
        user_code: verification.user_code,
        device_code: verification.device_code,
        expires_in: verification.expires_in,
        interval: verification.interval,
      });
    },
  });

  try {
    // Attendre l'autorisation (ceci poll automatiquement)
    const { token } = await auth({ type: 'oauth' });

    // Récupérer les infos utilisateur
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.users.getAuthenticated();

    // Récupérer l'email principal
    const { data: emails } = await octokit.users.listEmailsForAuthenticatedUser();
    const primaryEmail = emails.find(email => email.primary)?.email || emails[0]?.email || '';

    // Sauvegarder les credentials
    await saveCredentials({
      github_token: token,
      github_username: user.login,
      github_email: primaryEmail,
    });

    return {
      token,
      username: user.login,
      email: primaryEmail,
    };
  } catch (error: any) {
    // Améliorer le message d'erreur si c'est une erreur "Not Found"
    if (error.message?.includes('Not Found') || error.message?.includes('404')) {
      throw new Error(
        'GitHub OAuth App not found or Device Flow not enabled. Please check SETUP_GITHUB_OAUTH.md for configuration instructions.'
      );
    }
    throw new Error(`GitHub authorization failed: ${error.message}`);
  }
}

/**
 * Vérifie si l'utilisateur est déjà authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const credentials = await getCredentialStore();
  return !!credentials.github_token;
}

/**
 * Récupère les credentials GitHub stockés
 */
export async function getGitHubCredentials(): Promise<StoredCredentials | null> {
  const credentials = await getCredentialStore();
  if (!credentials.github_token) {
    return null;
  }
  return credentials;
}

/**
 * Vérifie si le token GitHub est valide
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    const octokit = new Octokit({ auth: token });
    await octokit.users.getAuthenticated();
    return true;
  } catch {
    return false;
  }
}

/**
 * Récupère un client Octokit authentifié
 */
export async function getAuthenticatedOctokit(): Promise<Octokit | null> {
  const credentials = await getGitHubCredentials();
  if (!credentials?.github_token) {
    return null;
  }

  // Vérifier que le token est valide
  const isValid = await validateToken(credentials.github_token);
  if (!isValid) {
    // Token expiré ou invalide, supprimer
    await clearCredentials();
    return null;
  }

  return new Octokit({ auth: credentials.github_token });
}

/**
 * Déconnecte l'utilisateur (supprime les credentials)
 */
export async function logout(): Promise<void> {
  await clearCredentials();
}

/**
 * Récupère les informations de l'utilisateur authentifié
 */
export async function getAuthenticatedUser(): Promise<{ username: string; email: string } | null> {
  const credentials = await getGitHubCredentials();
  if (!credentials) {
    return null;
  }

  return {
    username: credentials.github_username || '',
    email: credentials.github_email || '',
  };
}
