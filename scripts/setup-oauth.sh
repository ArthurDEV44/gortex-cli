#!/bin/bash

# Script d'aide pour configurer GitHub OAuth pour Gortex CLI

echo "🔧 Gortex CLI - GitHub OAuth Setup Helper"
echo "=========================================="
echo ""

# Vérifier si le Client ID est déjà configuré
if [ -n "$GORTEX_GITHUB_CLIENT_ID" ]; then
    echo "✓ GORTEX_GITHUB_CLIENT_ID est déjà configuré: $GORTEX_GITHUB_CLIENT_ID"
    echo ""
    read -p "Voulez-vous le remplacer ? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Configuration annulée."
        exit 0
    fi
fi

echo "Pour utiliser l'authentification GitHub OAuth dans Gortex CLI,"
echo "vous devez créer une GitHub OAuth App."
echo ""
echo "Étapes à suivre :"
echo ""
echo "1. Ouvrez https://github.com/settings/developers"
echo "2. Cliquez sur 'OAuth Apps' → 'New OAuth App'"
echo "3. Remplissez :"
echo "   - Application name: Gortex CLI - Dev"
echo "   - Homepage URL: https://github.com/ArthurDEV44/gortex-cli"
echo "   - Callback URL: http://localhost"
echo "4. Cliquez 'Register application'"
echo "5. ⚠️  IMPORTANT: Activez 'Device Flow' dans les settings de l'app"
echo "6. Copiez le Client ID (format: Ov23li...)"
echo ""
read -p "Appuyez sur Entrée quand vous avez créé l'OAuth App..."
echo ""

# Demander le Client ID
read -p "Entrez votre GitHub Client ID: " client_id

if [ -z "$client_id" ]; then
    echo "❌ Erreur: Client ID vide"
    exit 1
fi

# Valider le format (devrait commencer par Ov23li)
if [[ ! $client_id =~ ^Ov23li ]]; then
    echo "⚠️  Attention: Le Client ID ne semble pas avoir le bon format (devrait commencer par 'Ov23li')"
    read -p "Voulez-vous continuer quand même ? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Configuration annulée."
        exit 1
    fi
fi

# Déterminer le shell config file
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    if [ -f "$HOME/.bashrc" ]; then
        SHELL_CONFIG="$HOME/.bashrc"
    elif [ -f "$HOME/.bash_profile" ]; then
        SHELL_CONFIG="$HOME/.bash_profile"
    fi
fi

if [ -z "$SHELL_CONFIG" ]; then
    echo "⚠️  Impossible de détecter votre shell config file"
    echo ""
    echo "Ajoutez manuellement cette ligne à votre .bashrc ou .zshrc :"
    echo ""
    echo "export GORTEX_GITHUB_CLIENT_ID=\"$client_id\""
    echo ""
    exit 0
fi

# Demander confirmation
echo ""
echo "Configuration à ajouter à $SHELL_CONFIG :"
echo ""
echo "export GORTEX_GITHUB_CLIENT_ID=\"$client_id\""
echo ""
read -p "Voulez-vous l'ajouter automatiquement ? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Vérifier si déjà présent
    if grep -q "GORTEX_GITHUB_CLIENT_ID" "$SHELL_CONFIG"; then
        echo "⚠️  GORTEX_GITHUB_CLIENT_ID existe déjà dans $SHELL_CONFIG"
        echo "Mise à jour de la valeur..."
        # Utiliser sed pour remplacer
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/export GORTEX_GITHUB_CLIENT_ID=.*/export GORTEX_GITHUB_CLIENT_ID=\"$client_id\"/" "$SHELL_CONFIG"
        else
            # Linux
            sed -i "s/export GORTEX_GITHUB_CLIENT_ID=.*/export GORTEX_GITHUB_CLIENT_ID=\"$client_id\"/" "$SHELL_CONFIG"
        fi
    else
        # Ajouter à la fin
        echo "" >> "$SHELL_CONFIG"
        echo "# Gortex CLI - GitHub OAuth Client ID" >> "$SHELL_CONFIG"
        echo "export GORTEX_GITHUB_CLIENT_ID=\"$client_id\"" >> "$SHELL_CONFIG"
    fi

    echo "✓ Configuration ajoutée à $SHELL_CONFIG"
    echo ""
    echo "Pour appliquer immédiatement :"
    echo "  source $SHELL_CONFIG"
    echo ""
    echo "Ou redémarrez votre terminal."
else
    echo ""
    echo "Ajoutez manuellement cette ligne à $SHELL_CONFIG :"
    echo ""
    echo "export GORTEX_GITHUB_CLIENT_ID=\"$client_id\""
    echo ""
fi

# Tester la configuration
echo ""
echo "Pour tester la configuration :"
echo ""
echo "  export GORTEX_GITHUB_CLIENT_ID=\"$client_id\""
echo "  npm run build"
echo "  gortex commit"
echo ""

echo "✓ Setup terminé !"
echo ""
echo "📖 Pour plus d'informations, consultez SETUP_GITHUB_OAUTH.md"
