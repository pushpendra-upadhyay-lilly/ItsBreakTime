# Auto-Launch Feature Implementation

## ✨ Overview

Implemented user-controlled auto-launch feature with permission dialog and settings toggle.

## 🎯 What Changed

### 1. **Permission Dialog on First Run**
- Shows a friendly dialog asking users if they want BreakMate to start on login
- Only appears once (on first app launch)
- User choice is saved and respected on subsequent launches

### 2. **Settings Toggle**
- Added "Start BreakMate automatically when you log in" checkbox in Settings
- Toggle can be changed at any time
- Preference is persisted across app restarts

### 3. **Smart State Management**
- Settings are stored in electron-store
- Auto-launch state syncs between OS and app preferences
- Handles edge cases (user manually changes system settings, etc.)

## 📝 Technical Details

### Files Modified

1. **`src/main/main.ts`**
   - Added `autoLaunchConfigured` and `autoLaunchEnabled` to StoreSchema
   - Implemented `askAutoLaunchPermission()` function
   - Added IPC handlers: `auto-launch:enable`, `auto-launch:disable`, `auto-launch:is-enabled`
   - Imported `dialog` from Electron for permission prompt

2. **`src/main/preload.ts`**
   - Exposed `autoLaunch` API with `enable()`, `disable()`, and `isEnabled()` methods

3. **`src/renderer/types/electron.d.ts`**
   - Added TypeScript definitions for `autoLaunch` API

4. **`src/renderer/types/preload.d.ts`**
   - Added TypeScript definitions for `autoLaunch` API

5. **`src/renderer/components/Settings.svelte`**
   - Added "App Settings" section
   - Implemented auto-launch checkbox with loading state
   - Added toggle handler with error handling and state reversion

### How It Works

#### First Launch Flow:
1. App starts → `app.whenReady()` called
2. Window created → `ready-to-show` event fires
3. `askAutoLaunchPermission()` called after 1s delay
4. Dialog shown: "Start on Login?"
5. User clicks "Yes" or "No"
6. Preference saved: `autoLaunchConfigured: true`, `autoLaunchEnabled: true/false`
7. If "Yes", `autoLauncher.enable()` called

#### Subsequent Launches:
1. App checks if configured: `store.get('autoLaunchConfigured')`
2. If configured, syncs OS state with saved preference
3. No dialog shown

#### Settings Toggle:
1. User opens Settings
2. Checkbox loads current state from OS
3. User toggles checkbox
4. IPC handler called: `auto-launch:enable` or `auto-launch:disable`
5. OS setting changed + preference saved
6. On error, checkbox reverts to previous state

### Platform-Specific Behavior

**macOS:**
- Creates LaunchAgent plist: `~/Library/LaunchAgents/com.breakmate.app.plist`

**Windows:**
- Adds registry key: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`

**Linux:**
- Creates autostart desktop file: `~/.config/autostart/`

## 🧪 Testing

### Test the Permission Dialog:
1. Delete existing settings:
   ```bash
   rm -rf ~/Library/Application\ Support/breakmate-settings
   ```
2. Launch BreakMate
3. Dialog should appear after ~1 second
4. Try clicking "Yes" - verify auto-launch is enabled
5. Repeat with "No" - verify auto-launch is disabled

### Test the Settings Toggle:
1. Open BreakMate
2. Navigate to Settings
3. Toggle "Start BreakMate automatically..."
4. Verify checkbox state persists after app restart
5. Check OS-level setting matches app setting

### Verify Auto-Launch Works:
1. Enable auto-launch via dialog or settings
2. Quit BreakMate completely
3. Log out and log back in (or restart computer)
4. BreakMate should start automatically

### Check LaunchAgent on macOS:
```bash
# View LaunchAgent file
cat ~/Library/LaunchAgents/com.breakmate.app.plist

# Check if loaded
launchctl list | grep breakmate

# Manually disable (for testing)
launchctl unload ~/Library/LaunchAgents/com.breakmate.app.plist

# Re-enable
launchctl load ~/Library/LaunchAgents/com.breakmate.app.plist
```

## 🎨 UI/UX

### Permission Dialog:
- **Title**: "Start on Login?"
- **Message**: "Start BreakMate automatically when you log in?"
- **Detail**: "BreakMate works best when it runs in the background to remind you to take breaks."
- **Buttons**: ["Yes, start on login", "No, thanks"]
- **Default**: "Yes" button

### Settings Toggle:
- Located in new "App Settings" section
- Clear label: "Start BreakMate automatically when you log in"
- Shows loading state while checking current status
- Disabled during initial load to prevent premature toggles

## 🔒 Security

- All IPC channels are whitelisted in preload.ts
- Context isolation enabled
- No nodeIntegration in renderer
- Type-safe API between main and renderer

## 🐛 Error Handling

- Permission dialog errors logged to console
- Settings toggle reverts on failure
- Graceful fallback if auto-launch library fails
- User-friendly checkbox state management

## 📚 Dependencies

- **auto-launch** (v5.0.6): Cross-platform auto-launch management
- **electron-store** (v8.2.0): Persistent settings storage

## 🚀 Future Enhancements

Possible improvements:
- [ ] Show notification when auto-launch is enabled/disabled
- [ ] Add "Learn More" link in permission dialog
- [ ] Track analytics on permission acceptance rate
- [ ] Add auto-launch status indicator in tray menu
- [ ] Implement "Don't ask me again" option in dialog
