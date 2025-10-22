import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/es/**',
    '**/lib/**',
    '**/coverage/**',
  ],
  rules: {
    'no-console': 'off', // Logger 包允许使用 console
    'unused-imports/no-unused-vars': 'warn',
  },
})

