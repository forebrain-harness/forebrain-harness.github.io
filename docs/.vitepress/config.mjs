import { defineConfig } from "vitepress";

const enSidebar = [
  { text: "Getting Started", link: "/guide/getting-started" },
  { text: "CLI and Surfaces", link: "/guide/cli-and-surfaces" },
  { text: "Architecture", link: "/guide/architecture" },
  { text: "Context and Compaction", link: "/guide/context-and-compaction" },
  { text: "Memory Systems", link: "/guide/memory-systems" },
  { text: "Memory Internals", link: "/guide/memory-internals" },
  { text: "Skills and Tools", link: "/guide/skills-and-tools" },
  { text: "Subagents", link: "/guide/subagents" },
  { text: "Agent Collaboration Modes", link: "/guide/agent-collaboration-modes" },
  { text: "Safety Model", link: "/guide/safety-model" },
  { text: "CLI Command Reference", link: "/guide/cli-command-reference" },
  { text: "Telemetry", link: "/guide/telemetry" }
];

const zhSidebar = [
  { text: "快速开始", link: "/zh/guide/getting-started" },
  { text: "架构", link: "/zh/guide/architecture" },
  { text: "Memory 原理与机制", link: "/zh/guide/memory-internals" },
  { text: "Skill 加载机制", link: "/zh/guide/skills-internals" }
];

export default defineConfig({
  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: true,
  markdown: {
    theme: {
      light: "github-light",
      dark: "github-dark"
    }
  },
  locales: {
    root: {
      label: "English",
      lang: "en-US",
      link: "/",
      description: "Official documentation for Forebrain Harness: local AI coding runtime, gateway APIs, memory systems, tools, skills, subagents, and sandboxing.",
      themeConfig: {
        nav: [
          { text: "Guide", link: "/guide/getting-started" },
          { text: "Configuration", link: "/config/overview" },
          { text: "Develop", link: "/develop/build-and-release" },
          { text: "GitHub", link: "https://github.com/forebrain-harness/forebrain-harness" }
        ],
        sidebar: {
          "/guide/": enSidebar,
          "/config/": [
            {
              text: "Configuration Reference",
              items: [
                { text: "Configuration Reference", link: "/config/overview" },
                { text: "Runtime, Gateway, And Channels", link: "/config/runtime-gateway-and-channels" },
                { text: "Agents and Models", link: "/config/agents-and-models" },
                { text: "Projects And Project-Level MCP", link: "/config/projects-and-mcp" },
                { text: "Sandbox and Permissions", link: "/config/sandbox-and-permissions" },
                { text: "Memory, Compaction, And Runtime Features", link: "/config/memory-and-runtime-features" },
                { text: "Hooks And Skill Extensions", link: "/config/hooks-and-skill-extensions" }
              ]
            }
          ],
          "/develop/": [
            {
              text: "Develop",
              items: [
                { text: "Build and Release", link: "/develop/build-and-release" }
              ]
            }
          ]
        }
      }
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      link: "/zh/guide/memory-internals",
      description: "Forebrain Harness 官方文档：本地 AI 编码运行时、网关 API、记忆系统、工具、技能、子代理与沙箱。",
      themeConfig: {
        nav: [
          { text: "指南", link: "/zh/guide/memory-internals" },
          { text: "GitHub", link: "https://github.com/forebrain-harness/forebrain-harness" }
        ],
        sidebar: {
          "/zh/guide/": zhSidebar,
          "/zh/config/": [
            {
              text: "配置参考",
              items: [
                { text: "项目与项目级 MCP", link: "/zh/config/projects-and-mcp" }
              ]
            }
          ]
        }
      }
    }
  },
  themeConfig: {
    logo: "/mark.svg",
    socialLinks: [
      { icon: "github", link: "https://github.com/forebrain-harness/forebrain-harness" }
    ],
    footer: {
      message: "Official product documentation for Forebrain Harness.",
      copyright: "Copyright © Forebrain Harness"
    },
    outline: {
      level: [2, 3]
    },
    search: {
      provider: "local"
    }
  }
});
