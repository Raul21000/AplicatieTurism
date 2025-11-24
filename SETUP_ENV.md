# 🔐 Environment Variables Setup

## ⚠️ IMPORTANT: Security

**Never commit API keys directly in code!** GitHub will block your push if it detects secrets.

## 📝 Setup Instructions

### 1. Create `.env` file

In the root of your project, create a file named `.env`:

```bash
# Windows PowerShell
New-Item -Path .env -ItemType File

# Or create manually in your editor
```

### 2. Add your API keys

Open `.env` and add your keys:

```env
# Gemini API Key (required)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API Key (optional)
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Verify `.gitignore`

Make sure `.env` is in your `.gitignore` file (it should be already).

### 4. Restart Expo

After creating `.env`, restart your Expo development server:

```bash
# Stop current server (Ctrl+C)
# Then restart
npx expo start
```

## ✅ Verification

The `.env` file should:
- ✅ Exist in project root
- ✅ Be listed in `.gitignore`
- ✅ Contain your API keys
- ✅ **NOT** be committed to git

## 🚨 If you already committed secrets

If you already pushed secrets to git, you need to:

1. **Remove from git history** (see below)
2. **Rotate your API keys** (generate new ones)
3. **Update `.env` with new keys**

### Remove secret from git history

```bash
# Remove the file from git cache
git rm --cached lib/multi-ai-service.ts

# Amend the commit
git commit --amend

# Force push (only if you're sure!)
git push --force
```

**OR** use GitHub's secret scanning unblock URL (safer):
- Go to the URL provided in the error message
- Follow GitHub's instructions to allow the secret (if it's safe)

## 📚 More Info

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [GitHub Secret Scanning](https://docs.github.com/code-security/secret-scanning)

