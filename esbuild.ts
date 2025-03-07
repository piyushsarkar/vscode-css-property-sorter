import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import esbuild, { type PluginBuild } from 'esbuild';
import * as glob from 'glob';
import path from 'path';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * This plugin hooks into the build process to print errors in a format that the problem matcher in
 * Visual Studio Code can understand.
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',

  setup(build: PluginBuild) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location?.file}:${location?.line}:${location?.column}:`);
      });
      console.log('[watch] build finished');
    });
  },
};

/**
 * For web extension, all tests, including the test runner, need to be bundled into
 * a single module that has a exported `run` function .
 * This plugin bundles implements a virtual file extensionTests.ts that bundles all these together.
 * @type {import('esbuild').Plugin}
 */
const testBundlePlugin = {
  name: 'testBundlePlugin',
  setup(build: PluginBuild) {
    build.onResolve({ filter: /[/\\]extensionTests\.ts$/ }, (args) => {
      if (args.kind === 'entry-point') {
        return { path: path.resolve(args.path) };
      }
    });
    build.onLoad({ filter: /[/\\]extensionTests\.ts$/ }, async () => {
      const testsRoot = path.join(import.meta.dirname, 'src/test/suite');
      const files = await glob.glob('*.test.{ts,tsx}', { cwd: testsRoot, posix: true });
      return {
        contents:
          `export { run } from './mochaTestRunner.ts';` +
          files.map((f) => `import('./${f}');`).join(''),
        watchDirs: files.map((f) => path.dirname(path.resolve(testsRoot, f))),
        watchFiles: files.map((f) => path.resolve(testsRoot, f)),
      };
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts', 'src/test/suite/extensionTests.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'browser',
    outdir: 'dist',
    external: ['vscode'],
    logLevel: 'silent',
    // Node.js global to browser globalThis
    define: {
      global: 'globalThis',
    },

    plugins: [
      NodeGlobalsPolyfillPlugin({
        process: true,
        buffer: true,
      }),
      testBundlePlugin,
      esbuildProblemMatcherPlugin /* add to the end of plugins array */,
    ],
  });
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
