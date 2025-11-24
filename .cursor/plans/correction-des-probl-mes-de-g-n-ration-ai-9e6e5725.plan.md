<!-- 9e6e5725-80ff-43df-a2c2-d6e21e080d67 f5874195-19ba-4470-a03c-9da66aef79a6 -->
# Plan d'action : Correction des problèmes de génération AI

## Problèmes identifiés

1. **Chain-of-Thought reasoning timeout** : L'opération échoue avec "This operation was aborted" car le timeout de 30s est insuffisant pour les modèles locaux lors de la génération JSON complexe.

2. **Self-verification subject too long** : L'IA propose un sujet de 159 caractères alors que la limite est de 100 caractères, causant un échec silencieux de la vérification.

## Solutions à implémenter

### 1. Augmenter le timeout pour Chain-of-Thought reasoning

**Fichier**: `src/application/use-cases/GenerateAICommitUseCase.ts`

**Action**: Ajouter un timeout spécifique plus élevé pour l'étape Chain-of-Thought reasoning.

- Modifier l'appel à `generateText` pour le Chain-of-Thought (ligne 178) pour passer un timeout personnalisé via les options
- Le timeout par défaut de 30s reste pour les autres opérations
- Utiliser un timeout de 60-90s pour le Chain-of-Thought (génération JSON complexe avec maxTokens: 800)

**Détails techniques**:

- Ajouter un paramètre `timeout` optionnel dans l'interface des options de `generateText` dans `IAIProvider`
- Implémenter le timeout personnalisé dans `OllamaProvider.generateText()` (ligne 262)
- Utiliser le timeout personnalisé si fourni, sinon utiliser `this.timeout` par défaut
- Passer `timeout: 90000` (90s) lors de l'appel Chain-of-Thought dans `GenerateAICommitUseCase`

### 2. Ajouter la contrainte de longueur dans le prompt de vérification

**Fichier**: `src/ai/prompts/commit-message.ts`

**Action**: Modifier `generateVerificationSystemPrompt()` pour inclure explicitement la limite de 100 caractères.

- Ajouter dans le prompt système (ligne 644) une instruction claire sur la limite de longueur du subject
- Mentionner que le `improvedSubject` doit respecter la limite de 100 caractères maximum
- Inclure cette contrainte dans les critères de vérification

**Modification spécifique**:

- Ajouter dans `generateVerificationSystemPrompt()` : "IMPORTANT: Le subject amélioré (improvedSubject) doit respecter une limite stricte de 100 caractères maximum. Si tu proposes un improvedSubject, il DOIT être ≤ 100 caractères."

### 3. Valider et tronquer le sujet avant création du CommitSubject

**Fichier**: `src/application/use-cases/GenerateAICommitUseCase.ts`

**Action**: Ajouter une validation et une troncature intelligente avant la création du `CommitSubject` dans la self-verification.

- Avant d'appeler `CommitSubject.create()` avec `verification.improvedSubject` (ligne 282), vérifier la longueur
- Si le sujet dépasse 100 caractères, le tronquer intelligemment (couper à un espace proche de la limite, éviter de couper au milieu d'un mot)
- Ajouter un log d'avertissement si une troncature est nécessaire
- Créer une fonction utilitaire `truncateSubject()` dans un fichier approprié (peut-être `src/utils/validation.ts`)

**Détails techniques**:

- Créer `truncateSubject(subject: string, maxLength: number): string` qui :
- Tronque à la limite si nécessaire
- Préfère couper à un espace proche de la limite
- Ajoute "..." si tronqué (en comptant dans la limite)
- Utiliser cette fonction avant `CommitSubject.create()` dans la self-verification

### 4. Ajouter la limite dans le prompt utilisateur de vérification

**Fichier**: `src/ai/prompts/commit-message.ts`

**Action**: Modifier `generateVerificationUserPrompt()` pour rappeler la limite de longueur.

- Ajouter dans le prompt utilisateur (ligne 671) une mention explicite de la limite de 100 caractères
- Inclure cette contrainte dans les critères de vérification listés

**Modification spécifique**:

- Ajouter dans la liste des critères (après la ligne 712) : "6. Subject respecte la limite de 100 caractères maximum (contrainte stricte)"

### 5. Étendre le support du timeout personnalisé aux autres providers

**Fichiers**:

- `src/infrastructure/ai/MistralProviderAdapter.ts`
- `src/infrastructure/ai/OpenAIProviderAdapter.ts`
- `src/ai/providers/mistral.ts` (si existe)
- `src/ai/providers/openai.ts` (si existe)

**Action**: Vérifier et implémenter le support du timeout personnalisé dans les autres providers si nécessaire.

- Vérifier si Mistral et OpenAI ont déjà des mécanismes de timeout
- Si non, implémenter un comportement similaire à Ollama
- S'assurer que l'interface `IAIProvider.generateText()` accepte un paramètre `timeout` optionnel

## Ordre d'implémentation recommandé

1. Modifier l'interface `IAIProvider` pour accepter `timeout` dans les options de `generateText`
2. Implémenter le timeout personnalisé dans `OllamaProvider.generateText()`
3. Modifier les prompts de vérification (système et utilisateur) pour inclure la contrainte de longueur
4. Créer la fonction `truncateSubject()` et l'utiliser dans la self-verification
5. Augmenter le timeout pour Chain-of-Thought dans `GenerateAICommitUseCase`
6. Vérifier et étendre le support aux autres providers si nécessaire

## Tests à ajouter

- Test unitaire pour `truncateSubject()` avec différents cas (exactement 100 chars, > 100 chars, troncature à un espace)
- Test d'intégration pour vérifier que le Chain-of-Thought utilise le timeout personnalisé
- Test pour vérifier que la self-verification tronque correctement les sujets trop longs
- Test pour vérifier que les prompts incluent bien la contrainte de longueur

### To-dos

- [ ] Modifier l'interface IAIProvider pour accepter timeout dans les options de generateText
- [ ] Implémenter le timeout personnalisé dans OllamaProvider.generateText()
- [ ] Modifier generateVerificationSystemPrompt() pour inclure la contrainte de 100 caractères
- [ ] Modifier generateVerificationUserPrompt() pour rappeler la limite de longueur
- [ ] Créer la fonction truncateSubject() dans src/utils/validation.ts
- [ ] Utiliser truncateSubject() dans la self-verification avant CommitSubject.create()
- [ ] Augmenter le timeout pour Chain-of-Thought à 90s dans GenerateAICommitUseCase
- [ ] Vérifier et étendre le support timeout aux autres providers (Mistral, OpenAI)
- [ ] Ajouter des tests unitaires pour truncateSubject()
- [ ] Ajouter des tests d'intégration pour vérifier le timeout Chain-of-Thought et la troncature self-verification