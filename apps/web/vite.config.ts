import { fileURLToPath, URL } from 'node:url'
import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const require = createRequire(import.meta.url)

function copyIoniconsRuntimeFiles(): Plugin {
  return {
    name: 'copy-ionicons-runtime-files',
    apply: 'build',
    async writeBundle(outputOptions) {
      const ioniconsLoaderPath = require.resolve('ionicons/loader')
      const ioniconsRootDir = resolve(dirname(ioniconsLoaderPath), '../..')
      const ioniconsEsmDir = resolve(ioniconsRootDir, 'dist/esm')
      const outDir = outputOptions.dir ? resolve(process.cwd(), outputOptions.dir) : resolve(process.cwd(), 'dist')
      const assetsDir = resolve(outDir, 'assets')
      const ioniconsRuntimeFiles = await readdir(ioniconsEsmDir)

      await mkdir(assetsDir, { recursive: true })
      await Promise.all(
        ioniconsRuntimeFiles
          .filter((fileName) => fileName.endsWith('.js'))
          .map((fileName) =>
            copyFile(resolve(ioniconsEsmDir, fileName), resolve(assetsDir, fileName))
          )
      )
    }
  }
}

function normalizeBasePath(basePath?: string) {
  if (!basePath || basePath === '/') {
    return '/'
  }

  return `/${basePath.replace(/^\/+|\/+$/gu, '')}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: normalizeBasePath(env.VITE_BASE_URL),
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('ion-')
          }
        }
      }),
      copyIoniconsRuntimeFiles()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
})
