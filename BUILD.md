# Build Guide for BreakMate

## Quick Start

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build:mac
```

---

## Build Commands

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run dev:renderer` | Run renderer (UI) only |
| `npm run dev:main` | Run main process only |
| `npm start` | Launch app with Electron Forge |

### Production Builds

#### macOS

```bash
# Build for current Mac architecture
npm run build:mac

# Build for Apple Silicon (M1/M2/M3)
npm run build:mac:arm64

# Build for Intel Macs
npm run build:mac:x64

# Build Universal binary (both Intel and Apple Silicon)
npm run build:mac:universal
```

#### Cross-Platform

```bash
# Build for current platform
npm run make

# Package only (no distributables)
npm run package

# Package for macOS
npm run package:mac
```

---

## Build Output

### Location
- **Packaged apps**: `out/<app-name>-darwin-arm64/`
- **Distributables**: `out/make/`
- **Compiled code**: `dist/`

### Files Generated

**For macOS:**
- `BreakMate-darwin-arm64-<version>.zip` (Apple Silicon)
- `BreakMate-darwin-x64-<version>.zip` (Intel)
- `BreakMate-darwin-universal-<version>.zip` (Universal)

---

## Build Configuration

### forge.config.js

Key configurations:
- **App Name**: BreakMate
- **Bundle ID**: com.breakmate.app
- **Category**: Productivity
- **Icon**: `./assets/icon.icns`
- **ASAR**: Enabled (for code protection)

### Customization

To modify build settings, edit `forge.config.js`:

```javascript
packagerConfig: {
  name: 'YourAppName',
  appBundleId: 'com.yourcompany.app',
  icon: './path/to/icon',
  // ... more options
}
```

---

## Platform-Specific Notes

### macOS

**Requirements:**
- Xcode Command Line Tools
- macOS 10.13+ to build
- macOS 10.13+ to run

**Architectures:**
- `arm64`: Apple Silicon (M1/M2/M3) - smaller, faster on new Macs
- `x64`: Intel processors - for older Macs
- `universal`: Both architectures - larger file size, works everywhere

**Recommended for Distribution:**
- Use Universal binary for maximum compatibility
- Or provide separate builds for Intel and Apple Silicon

**Code Signing (Optional):**
To sign your app, add to `forge.config.js`:
```javascript
osxSign: {
  identity: 'Developer ID Application: Your Name (TEAM_ID)',
},
osxNotarize: {
  appleId: process.env.APPLE_ID,
  appleIdPassword: process.env.APPLE_ID_PASSWORD,
}
```

### Windows

Build on Windows or use cross-compilation:
```bash
npm run make -- --platform win32
```

### Linux

Build on Linux or use cross-compilation:
```bash
npm run make -- --platform linux
```

---

## Troubleshooting

### Build Fails

1. **Clear node_modules and rebuild:**
   ```bash
   rm -rf node_modules
   npm install
   ```

2. **Clear build cache:**
   ```bash
   rm -rf dist out
   npm run build
   ```

3. **Check Node.js version:**
   ```bash
   node --version  # Should be v20+
   ```

### Cannot Run Built App

1. **macOS Gatekeeper:** 
   Right-click app → Open → Open anyway

2. **Permissions:**
   ```bash
   chmod +x out/BreakMate-darwin-arm64/BreakMate.app/Contents/MacOS/BreakMate
   ```

### Large File Size

- Use architecture-specific builds instead of universal
- Check `extraResource` in forge.config.js
- Ensure dev dependencies aren't bundled

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build macOS

on: [push]

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build:mac:universal
      - uses: actions/upload-artifact@v3
        with:
          name: mac-build
          path: out/make/**/*.zip
```

---

## Distribution

### macOS App Store
1. Configure `osxSign` and `osxNotarize`
2. Create app-specific password
3. Build and notarize
4. Submit via Transporter

### Direct Distribution
1. Build with code signing (optional but recommended)
2. Create DMG or distribute ZIP
3. Host on website or GitHub Releases

### Auto-Updates
Configure `macUpdateManifestBaseUrl` in forge.config.js for Electron's auto-updater.

---

## Advanced Options

### Custom Architectures

```bash
# Build for specific architecture
electron-forge make --platform darwin --arch arm64

# Build for multiple architectures
electron-forge make --platform darwin --arch arm64,x64
```

### Debug Build

```bash
# Enable source maps and debug symbols
cross-env NODE_ENV=development npm run build
```

### Production Optimization

```bash
# Minimize and optimize
cross-env NODE_ENV=production npm run build
```

---

## Additional Resources

- [Electron Forge Documentation](https://www.electronforge.io/)
- [Electron Builder](https://www.electron.build/) (alternative)
- [macOS Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Electron Documentation](https://www.electronjs.org/docs/latest/)
