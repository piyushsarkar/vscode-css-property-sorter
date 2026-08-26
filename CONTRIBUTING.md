# Contributing to Sort CSS

Thank you for your interest in contributing to **Sort CSS** (`vscode-css-property-sorter`)! This document provides instructions and guidelines for setting up the development environment, running tests, building the extension, and submitting pull requests.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
  - [Watch Mode](#watch-mode)
  - [Debugging in VS Code](#debugging-in-vs-code)
- [Scripts Overview](#scripts-overview)
  - [Building & Type Checking](#building--type-checking)
  - [Linting & Formatting](#linting--formatting)
  - [Testing](#testing)
  - [Packaging](#packaging)
- [Project Architecture](#project-architecture)
- [Pull Request Guidelines](#pull-request-guidelines)

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Node.js** (LTS recommended)
- **npm**
- **Visual Studio Code**

---

## Getting Started

1. **Fork the Repository**  
   Click the **Fork** button at the top right of the GitHub repository page to create your own copy.

2. **Clone Your Fork**  
   ```bash
   git clone https://github.com/YOUR-USERNAME/vscode-css-property-sorter.git
   cd vscode-css-property-sorter
   ```

3. **Install Dependencies**  
   ```bash
   npm install
   ```

---

## Development Workflow

### Watch Mode

To continuously compile TypeScript types and bundle the web extension while you edit source files:

```bash
npm run watch-web
```

This runs `watch-web:esbuild` and `watch-web:tsc` concurrently using `npm-run-all`.

### Debugging in VS Code

1. Open the project folder in VS Code.
2. Press `F5` or select **Run and Debug** from the sidebar and click **Extension (Web Extension)**.
3. A new **Extension Development Host** window will open with the extension loaded.
4. Test commands such as `Sort CSS: Run` (`Alt+S` / `Option+S`) or toggle settings in the test window.

---

## Scripts Overview

### Building & Type Checking

- **Type Check**: Verify TypeScript types without emitting code.
  ```bash
  npm run check-types
  ```
- **Compile**: Run type checks, oxlint, and bundle the code into `dist/`.
  ```bash
  npm run compile
  ```

### Linting & Formatting

This project uses [oxlint](https://oxc.rs/) for linting and [oxfmt](https://oxc.rs/) for code formatting.

- **Lint**: Run code linter.
  ```bash
  npm run lint
  ```
- **Format Code**: Automatically format source files.
  ```bash
  npm run fmt
  ```
- **Check Formatting**: Verify code formatting without making changes.
  ```bash
  npm run fmt:check
  ```

### Testing

- **Run Tests**: Compiles the extension and runs tests inside Chromium using `@vscode/test-web`.
  ```bash
  npm test
  ```
- **Run in Browser**: Launch the extension in a web test environment.
  ```bash
  npm run run-in-browser
  ```

### Packaging

- **Build Production Bundle**:
  ```bash
  npm run package
  ```
- **Create VSIX Package**:
  ```bash
  npm run create-package
  ```

---

## Project Architecture

Key files inside the `src/` directory:

- `src/extension.ts` - Main entry point; handles extension activation, command subscriptions, and the `onWillSaveTextDocument` event listener.
- `src/actions.ts` - Execution logic for sorting full documents or selected text.
- `src/sorter.ts` - Core CSS sorting engine using PostCSS and `css-declaration-sorter`.
- `src/config.ts` - Reads configuration settings (`sortcss.sortOnSave`, `sortcss.sortingStrategy`, `sortcss.ignoredFiles`, `sortcss.manualOrder`).
- `src/utils.ts` - Helper utility functions (extracting `<style>` blocks in HTML, Vue, Svelte, Astro files, file matching).
- `src/test/suite/` - Unit and integration tests run via Mocha and `@vscode/test-web`.
- `esbuild.ts` - Custom esbuild configuration script for bundling the web extension.

---

## Pull Request Guidelines

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
   *(or `fix/your-bug-fix`)*

2. **Make & Validate Your Changes**
   Before committing, verify that all checks pass:
   ```bash
   npm run check-types
   npm run lint
   npm run fmt:check
   npm test
   ```

3. **Commit & Push**
   Write clear and descriptive commit messages, then push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request**
   - Navigate to the original repository on GitHub.
   - Create a Pull Request targeting the `main` branch.
   - Describe the changes made, why they were needed, and reference any open issues.
