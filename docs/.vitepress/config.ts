import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@ldesign/logger',
  description: 'LDesign 企业级日志系统',
  lang: 'zh-CN',
  base: '/logger/',

  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/logger' },
      { text: '示例', link: '/examples/basic' },
      {
        text: '链接',
        items: [
          { text: 'GitHub', link: 'https://github.com/ldesign/ldesign' },
          { text: 'NPM', link: 'https://www.npmjs.com/package/@ldesign/logger' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '核心概念', link: '/guide/concepts' },
            { text: '配置指南', link: '/guide/configuration' },
            { text: '最佳实践', link: '/guide/best-practices' }
          ]
        },
        {
          text: '进阶',
          items: [
            { text: '性能优化', link: '/guide/performance' },
            { text: '错误处理', link: '/guide/error-handling' },
            { text: '日志查询', link: '/guide/querying' },
            { text: '采样与限流', link: '/guide/sampling' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: 'Logger', link: '/api/logger' },
            { text: 'Transports', link: '/api/transports' },
            { text: 'Formatters', link: '/api/formatters' },
            { text: 'Filters', link: '/api/filters' },
            { text: 'Context', link: '/api/context' },
            { text: 'Query', link: '/api/query' },
            { text: 'Sampling', link: '/api/sampling' },
            { text: 'Stats', link: '/api/stats' }
          ]
        }
      ],
      '/examples/': [
        {
          text: '示例',
          items: [
            { text: '基础用法', link: '/examples/basic' },
            { text: '高级用法', link: '/examples/advanced' },
            { text: '多传输器', link: '/examples/multi-transport' },
            { text: '自定义格式化', link: '/examples/custom-formatter' },
            { text: '过滤器', link: '/examples/filters' },
            { text: '性能监控', link: '/examples/performance' },
            { text: '错误追踪', link: '/examples/error-tracking' },
            { text: '生产环境配置', link: '/examples/production' },
            { text: '完整实例', link: '/examples/real-world' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ldesign/ldesign' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 LDesign Team'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/ldesign/ldesign/edit/main/packages/logger/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    }
  }
})

