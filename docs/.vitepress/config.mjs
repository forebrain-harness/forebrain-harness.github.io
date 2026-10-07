import { monokaiLight } from "./shiki/monokai-light.mjs";
import { defineConfig } from "vitepress";

const sidebar = [
  {
    text: "Guide",
    items: [
      { text: "Getting Started", link: "/guide/getting-started" },
      { text: "What You Can Do", link: "/guide/what-you-can-do" },
      { text: "Choose Your Surface", link: "/guide/cli-and-surfaces" },
      { text: "Run It As A Gateway", link: "/guide/gateway" },
      { text: "Your Agent In Team Chat", link: "/guide/chat-channels" },
      { text: "Code Intelligence", link: "/guide/code-intelligence" },
      { text: "Remember Across Sessions", link: "/guide/memory-systems" },
      { text: "Delegate To Subagents", link: "/guide/subagents" },
      { text: "Extend With Skills", link: "/guide/skills-and-tools" },
      { text: "Stay In Control", link: "/guide/safety-model" }
    ]
  },
  {
    text: "Reference",
    items: [
      { text: "CLI Command Reference", link: "/guide/cli-command-reference" },
      { text: "Configuration Reference", link: "/config/overview" },
      { text: "Runtime, Gateway, And Channels", link: "/config/runtime-gateway-and-channels" },
      { text: "Agents and Models", link: "/config/agents-and-models" },
      { text: "Projects And Project-Level MCP", link: "/config/projects-and-mcp" },
      { text: "Sandbox and Permissions", link: "/config/sandbox-and-permissions" },
      { text: "Memory, Compaction, And Runtime Features", link: "/config/memory-and-runtime-features" },
      { text: "Hooks And Skill Extensions", link: "/config/hooks-and-skill-extensions" }
    ]
  },
  {
    text: "Internals",
    items: [
      { text: "Architecture", link: "/guide/architecture" },
      { text: "Context and Compaction", link: "/guide/context-and-compaction" },
      { text: "Memory Internals", link: "/guide/memory-internals" },
      { text: "Skills Internals", link: "/guide/skills-internals" },
      { text: "Agent Collaboration Modes", link: "/guide/agent-collaboration-modes" },
      { text: "Telemetry", link: "/guide/telemetry" }
    ]
  },
  {
    text: "Develop",
    items: [ { text: "Build and Release", link: "/develop/build-and-release" } ]
  }
];

const zhSidebar = [
  {
    text: "指南",
    items: [
      { text: "快速开始", link: "/zh/guide/getting-started" },
      { text: "你能做什么", link: "/zh/guide/what-you-can-do" },
      { text: "选择你的工作面", link: "/zh/guide/cli-and-surfaces" },
      { text: "作为 Gateway 运行", link: "/zh/guide/gateway" },
      { text: "团队聊天里的 Agent", link: "/zh/guide/chat-channels" },
      { text: "代码智能", link: "/zh/guide/code-intelligence" },
      { text: "跨会话记忆", link: "/zh/guide/memory-systems" },
      { text: "委派给子代理", link: "/zh/guide/subagents" },
      { text: "用 Skill 扩展", link: "/zh/guide/skills-and-tools" },
      { text: "保持掌控", link: "/zh/guide/safety-model" }
    ]
  },
  {
    text: "参考",
    items: [
      { text: "CLI 命令参考", link: "/zh/guide/cli-command-reference" },
      { text: "配置参考", link: "/zh/config/overview" },
      { text: "运行时、Gateway 与渠道", link: "/zh/config/runtime-gateway-and-channels" },
      { text: "Agent 与模型", link: "/zh/config/agents-and-models" },
      { text: "项目与项目级 MCP", link: "/zh/config/projects-and-mcp" },
      { text: "沙箱与权限", link: "/zh/config/sandbox-and-permissions" },
      { text: "Memory、压缩与运行时特性", link: "/zh/config/memory-and-runtime-features" },
      { text: "Hook 与 Skill 扩展", link: "/zh/config/hooks-and-skill-extensions" }
    ]
  },
  {
    text: "内部原理",
    items: [
      { text: "架构", link: "/zh/guide/architecture" },
      { text: "上下文与压缩", link: "/zh/guide/context-and-compaction" },
      { text: "Memory 原理与机制", link: "/zh/guide/memory-internals" },
      { text: "技能原理", link: "/zh/guide/skills-internals" },
      { text: "Agent 协作模式", link: "/zh/guide/agent-collaboration-modes" },
      { text: "遥测", link: "/zh/guide/telemetry" }
    ]
  },
  {
    text: "开发",
    items: [ { text: "构建与发布", link: "/zh/develop/build-and-release" } ]
  }
];

export default defineConfig({
  title: "Forebrain Harness",
  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: true,
  markdown: {
    theme: {
      light: monokaiLight,
      dark: "monokai"
    }
  },
  locales: {
    root: {
      label: "English",
      lang: "en-US",
      link: "/",
      description: "Official documentation for Forebrain Harness: one open-source agent runtime for your terminal, your browser, and your team's chat apps.",
      themeConfig: {
        nav: [
          { text: "Guide", link: "/guide/getting-started" },
          { text: "Configuration", link: "/config/overview" },
          { text: "Develop", link: "/develop/build-and-release" },
          { text: "GitHub", link: "https://github.com/forebrain-harness/forebrain-harness" }
        ],
        sidebar
      }
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      link: "/zh/guide/getting-started",
      description: "Forebrain Harness 官方文档：一个开源 agent 运行时，同时覆盖你的终端、浏览器和团队聊天应用。",
      themeConfig: {
        nav: [
          { text: "指南", link: "/zh/guide/getting-started" },
          { text: "配置", link: "/zh/config/overview" },
          { text: "开发", link: "/zh/develop/build-and-release" },
          { text: "GitHub", link: "https://github.com/forebrain-harness/forebrain-harness" }
        ],
        sidebar: zhSidebar
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
