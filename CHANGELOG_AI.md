# 🤖 AI Feature Changelog

## Version 2.1.0 - AI-Powered Commit Messages (Unreleased)

### ✨ New Features

#### AI-Powered Commit Message Generator

**Automatically generate conventional commit messages using AI based on your staged changes.**

##### Supported Providers

1. **Ollama (Local)**
   - 100% private and free
   - Works offline
   - Recommended model: `mistral:7b` (4GB RAM required)
   - Alternative for laptops: `phi:2.7b` (1.6GB RAM)

2. **Mistral AI (Cloud)**
   - Fast and performant
   - Recommended model: `mistral-small-latest`
   - Requires API key

3. **OpenAI (Cloud)**
   - Very performant
   - Recommended model: `gpt-4o-mini`
   - Requires API key

##### New Command

```bash
gortex ai-suggest
# or
gortex ai
```

##### Configuration

Add to `.gortexrc`:

```json
{
  "ai": {
    "enabled": true,
    "provider": "ollama",
    "ollama": {
      "model": "mistral:7b"
    }
  }
}
```

##### Features

- **Context-Aware Analysis**: Analyzes file changes, branch name, and recent commits
- **Smart Type Detection**: Automatically suggests the correct commit type
- **Scope Inference**: Detects scope based on modified files
- **Confidence Score**: Shows AI confidence level (0-100%)
- **Reasoning Explanation**: Explains why certain choices were made
- **Interactive Preview**: Review and confirm before committing

##### Architecture

**New Modules:**
- `src/ai/` - AI service layer
  - `providers/base.ts` - Common provider interface
  - `providers/ollama.ts` - Ollama implementation
  - `providers/mistral.ts` - Mistral AI implementation
  - `providers/openai.ts` - OpenAI implementation
  - `analyzer.ts` - Diff analysis and context extraction
  - `prompts/commit-message.ts` - Prompt engineering
  - `index.ts` - Main AI service

**New Commands:**
- `src/commands/ai-suggest.tsx` - AI suggestion command

**New Components:**
- `src/components/AISuggestWorkflow.tsx` - Interactive AI workflow UI

##### Documentation

- `docs/AI_SETUP.md` - Complete setup guide for all providers
- `.gortexrc.ai-example` - Example configuration file

##### Type System

**New Types:**
```typescript
AIProvider = 'ollama' | 'mistral' | 'openai' | 'disabled'

interface AIConfig {
  enabled?: boolean;
  provider?: AIProvider;
  ollama?: {...};
  mistral?: {...};
  openai?: {...};
  temperature?: number;
  maxTokens?: number;
  autoSuggest?: boolean;
  requireConfirmation?: boolean;
}

interface AIGeneratedCommit {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  breaking?: boolean;
  breakingDescription?: string;
  confidence?: number;
  reasoning?: string;
}
```

### 🎯 Use Cases

1. **Solo Developers**: Save time writing commit messages
2. **Teams**: Ensure consistent commit message quality
3. **Junior Developers**: Learn conventional commit best practices
4. **Code Reviews**: Generate better PR descriptions from commits
5. **Changelog Generation**: AI-generated commits are perfect for automated changelogs

### 🔒 Privacy & Security

- **Ollama**: 100% private, runs locally, no data sent online
- **Cloud Providers**: Diff is sent to API (never store sensitive data in commits)
- **API Keys**: Stored in config or environment variables
- **No Tracking**: Gortex CLI does not track usage

### ⚡ Performance

| Provider | Avg. Response Time | RAM Usage | Cost |
|----------|-------------------|-----------|------|
| Ollama (mistral:7b) | 1-3s (CPU) | 4GB | Free |
| Ollama (phi:2.7b) | <1s (CPU) | 1.6GB | Free |
| Mistral AI | <1s | N/A | ~$0.001/req |
| OpenAI | <1s | N/A | ~$0.0001/req |

### 🚀 Future Enhancements

Planned for future releases:

1. **Auto-Suggest in Main Workflow**: Optional AI step in `gortex commit`
2. **Learning from History**: Train on your repo's commit style
3. **Multi-Language Support**: Commit messages in your language
4. **Batch Mode**: Generate commits for multiple staged groups
5. **Custom Prompts**: User-defined prompt templates
6. **Git Hook Integration**: Auto-suggest on `git commit`

### 🙏 Credits

- **Ollama Team**: For making local LLMs accessible
- **Mistral AI**: For open-source models and API
- **OpenAI**: For GPT models

---

## Breaking Changes

None. This is a purely additive feature that defaults to disabled.

## Migration Guide

No migration needed. AI features are opt-in via configuration.

---

**Full documentation**: [AI Setup Guide](docs/AI_SETUP.md)
