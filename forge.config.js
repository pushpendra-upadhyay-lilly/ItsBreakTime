import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

export default {
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'pushpendra-upadhyay-lilly',
          name: 'ItsBreakTime'
        },
        prerelease: false,
        draft: true, // Creates a draft release so you can review before publishing
      }
    }
  ],
  packagerConfig: {
    asar: true,
    name: 'BreakMate',
    executableName: 'BreakMate',
    appBundleId: 'com.breakmate.app',
    appCategoryType: 'public.app-category.productivity',
    icon: './assets/icon', // Will use icon.icns on macOS
    // Disable code signing for development/corporate environments
    // osxSign: {}, // Empty object for basic signing
    // osxNotarize: undefined, // Can be configured later for notarization
    extraResource: [
      './assets'
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        macUpdateManifestBaseUrl: undefined, // Can be set for auto-updates
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      // Disable ASAR integrity validation for corporate environments
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};
