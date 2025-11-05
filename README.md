# ItsBreakTime

A free and open-source desktop application for digital wellness and healthy screen habits. ItsBreakTime brings all the features of LookAway to everyone, completely free—helping you combat digital eye strain, maintain better posture, and build sustainable work routines.[1][2][3]

## Description

ItsBreakTime is a cross-platform desktop application built with Electron and Svelte that helps protect your eyes and boost productivity through smart break reminders. The app runs in your system tray and intelligently reminds you to take breaks, preventing eye strain, poor posture, and burnout.[2][1]

### Key Features

- **Customizable Break Intervals**: Set your own work-rest rhythm with frequent short breaks and occasional longer breaks[1]
- **Smart Break Detection**: Automatically pauses during meetings, video playback, screen sharing, and gaming[2]
- **Wellness Reminders**: Get notified to blink, stretch, and maintain proper posture throughout the day[1]
- **Idle-Time Detection**: Only reminds you when you're actively working, not when you're away[2]
- **Pre-Break Notifications**: Gentle warnings before breaks so you can wrap up tasks smoothly[1]
- **Lightweight & Private**: All processing happens locally on your machine[3]

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: Version 20 or higher[4]
- **npm**: Comes with Node.js (or yarn/pnpm as alternatives)[4]
- **Git**: For cloning the repository

### Platform-Specific Requirements

- **macOS**: macOS 10.13 or higher
- **Windows**: Windows 10 or higher

## Getting Started

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/itsbreaktime.git
cd itsbreaktime
```

2. Install dependencies:

```bash
npm install
```

All required dependencies are listed in `package.json` and will be installed automatically.[4]

## Testing Locally

### Development Mode

To run the app in development mode with hot-reload:

```bash
npm run dev
```

This command runs both the Svelte renderer and Electron main process concurrently. The renderer will be available at `http://localhost:5173` before launching the Electron window.[4]

### Alternative Development Commands

- **Run renderer only** (for UI development):

```bash
npm run dev:renderer
```

- **Run main process only**:

```bash
npm run dev:main
```

- **Start with Electron Forge**:

```bash
npm start
```

This launches the app using electron-forge without the development server.[4]

## Building the App

### Build for Development

To compile TypeScript and build the renderer:

```bash
npm run build
```

This runs both `build:main` and `build:renderer` scripts.[4]

### Create Distributables

To package the app and create platform-specific distributables:

```bash
npm run make
```

This command uses Electron Forge to:

1. Package your app code with the Electron binary[5][6]
2. Create distributables for your current platform (`.exe` for Windows, `.app` for macOS)[5]

Distributables will be generated in the `out/make/` directory.[7][6]

### Package Only (Without Creating Distributables)

To create a packaged app without generating distributables:

```bash
npm run package
```

The packaged app will be in the `out/` folder.[5][4]

## Project Structure

```
itsbreaktime/
├── dist/               # Compiled output
│   └── main/          # Compiled main process
├── out/               # Built distributables
├── src/               # Source code
│   ├── main/          # Electron main process
│   └── renderer/      # Svelte renderer
├── package.json       # Project configuration
├── tsconfig.json      # TypeScript configuration
└── vite.config.ts     # Vite configuration
```

## How to Contribute

We welcome contributions from the community! Here's how you can help:

### Reporting Issues

- Check if the issue already exists in the [Issues](https://github.com/yourusername/itsbreaktime/issues) section
- Provide detailed information: OS version, Node version, steps to reproduce
- Include screenshots or error logs when applicable

### Submitting Pull Requests

1. **Fork the repository** and create your branch from `main`:

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes** and ensure the code follows the project style
3. **Test your changes** thoroughly:

```bash
npm run dev
npm run build
```

4. **Commit your changes** with a clear message:

```bash
git commit -m "Add: Description of your feature"
```

5. **Push to your fork** and submit a pull request:

```bash
git push origin feature/your-feature-name
```

### Development Guidelines

- Write clean, readable code with comments where necessary
- Follow TypeScript best practices
- Test on both macOS and Windows if possible
- Update documentation if you're adding new features
- Keep commits atomic and descriptive

### Code of Conduct

Be respectful, inclusive, and constructive in all interactions. We're building this together!

## Technology Stack

- **Electron**: Cross-platform desktop framework (v39.0.0)[4]
- **Svelte**: Reactive UI framework (v5.43.2)[4]
- **TypeScript**: Type-safe JavaScript development[4]
- **Vite**: Fast build tool and development server[4]
- **Electron Forge**: Packaging and distribution[4]

## Scripts Reference

| Command           | Description                                    |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Run app in development mode with hot-reload[4] |
| `npm start`       | Start app with Electron Forge[4]               |
| `npm run build`   | Build main and renderer for production[4]      |
| `npm run package` | Package app without creating distributables[4] |
| `npm run make`    | Create platform-specific distributables[4]     |

## License

This project is licensed under the ISC License.[4]

## Acknowledgments

ItsBreakTime is inspired by LookAway, bringing digital wellness features to everyone through open source.[3][2][1]

---

**Built with ❤️ by the open-source community**
