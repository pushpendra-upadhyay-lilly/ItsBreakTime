# Publishing BreakMate to GitHub Releases

## Setup Complete! ✅

Your project is now configured to publish to GitHub Releases using Electron Forge.

## Prerequisites

Before publishing, you need to create a GitHub Personal Access Token:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "BreakMate Publishing"
4. Select these scopes:
   - `repo` (all repo permissions)
5. Click "Generate token"
6. **Copy the token immediately** (you won't be able to see it again)

## Set Up the Token

Add the token to your environment:

```bash
export GITHUB_TOKEN="your_token_here"
```

Or add it to your `~/.zshrc` file for permanent access:

```bash
echo 'export GITHUB_TOKEN="your_token_here"' >> ~/.zshrc
source ~/.zshrc
```

## Publishing Steps

### 1. Update Version

First, update the version in `package.json`:

```bash
npm version patch  # for bug fixes (1.0.0 → 1.0.1)
npm version minor  # for new features (1.0.0 → 1.1.0)
npm version major  # for breaking changes (1.0.0 → 2.0.0)
```

This will automatically create a git tag.

### 2. Build and Publish

Run the publish command:

```bash
npm run publish
```

This will:
- Build your app (main + renderer)
- Package it with Electron Forge
- Create distributables (DMG, ZIP, etc.)
- Create a **draft release** on GitHub
- Upload all build artifacts

### 3. Review and Publish on GitHub

1. Go to your GitHub repository: https://github.com/pushpendra-upadhyay-lilly/ItsBreakTime/releases
2. You'll see a draft release with your build artifacts attached
3. Edit the release notes
4. Click "Publish release" when ready

## Configuration Details

The publisher is configured in `forge.config.js`:

- **Draft Mode**: Releases are created as drafts by default, so you can review before publishing
- **Repository**: `pushpendra-upadhyay-lilly/ItsBreakTime`
- **Prerelease**: Set to `false` (change to `true` for beta releases)

## Customization Options

### Create Pre-releases

To mark a release as pre-release (beta, alpha, etc.):

1. Update version to something like `1.0.0-beta.1`
2. In `forge.config.js`, set `prerelease: true`

### Auto-publish (Skip Draft)

If you want to skip the draft step and publish immediately:

In `forge.config.js`, set `draft: false`

### Platform-Specific Publishing

To publish only for macOS:

```bash
npm run build && electron-forge publish --platform darwin
```

For specific architecture:

```bash
npm run build && electron-forge publish --platform darwin --arch arm64
npm run build && electron-forge publish --platform darwin --arch x64
```

## Troubleshooting

### Authentication Error

If you see "Bad credentials", make sure:
- Your `GITHUB_TOKEN` is set correctly
- The token has the `repo` scope
- The token hasn't expired

### Permission Error

Make sure your token has write access to the repository.

### Build Artifacts Not Uploading

Check that your makers are configured correctly in `forge.config.js`. Currently configured:
- ZIP (macOS)
- Squirrel (Windows)
- DEB (Linux)
- RPM (Linux)

## Additional Resources

- [Electron Forge Publishing Documentation](https://www.electronforge.io/config/publishers)
- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
