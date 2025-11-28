import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: false,
  ignores: ['**/es/**', '**/lib/**', '**/dist/**', '**/node_modules/**'],
})

