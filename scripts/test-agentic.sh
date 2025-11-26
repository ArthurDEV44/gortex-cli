#!/bin/bash
# Script de test pour le workflow agentique avec debug activé

echo "🧪 Test du Reflection Pattern avec debug..."
echo ""
echo "Configuration:"
echo "- GORTEX_DEBUG=true"
echo "- Provider: Ollama"
echo "- Model: Magistral 24B"
echo ""

# Activer le mode debug
export GORTEX_DEBUG=true

# Lancer Gortex CLI
node dist/index.js commit

# Note: Pour tester, assurez-vous que:
# 1. Ollama est en cours d'exécution (ollama serve)
# 2. Le modèle magistral:24b est téléchargé (ollama pull magistral:24b)
# 3. Vous avez des changements stagés dans votre repo
