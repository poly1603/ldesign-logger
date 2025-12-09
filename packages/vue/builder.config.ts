/**
 * @ldesign/logger-vue 构建配置
 */
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',
  output: [
    { format: 'esm', dir: 'es', preserveModules: true, preserveModulesRoot: 'src' },
    { format: 'esm', dir: 'esm', preserveModules: true, preserveModulesRoot: 'src' },
    { format: 'cjs', dir: 'lib', preserveModules: true, preserveModulesRoot: 'src' },
    { format: 'umd', dir: 'dist', name: 'LDesignLoggerVue' },
  ],
  external: ['vue', 'vue-router', '@ldesign/logger-core'],
  dts: true,
  clean: true,
})
