# 跨会话记忆

你给过一次的上下文会自己回来：Forebrain Harness 按项目和全局保存
memory，从过去的会话中提炼它，并能跨英文、中文、日文和韩文检索。

## Agent 记住什么

两个作用域，一种行为：

- **Per-project memory** — 这个代码库怎么构建、怎么测试、怎么部署，以及
  你的团队一路上纠正过什么。它属于你打开的那个项目。
- **Global memory** — 跨项目跟随你的偏好和事实。

Memory 不是原始 transcript 回放。一条后台流水线把已完成的会话提炼成
持久的 note，下个会话回来的就是提炼后的结果。

如果你运行多个主代理，每个主代理的 memory 完全隔离——切换 agent 就是
切换 memory。

## 在会话里驾驭它

- **说一句"记住这个"。** 显式的"记住这个"（或"忘掉那个"）总会写入一条
  note——在同一条回复里捕获、保存前先给你看、从下一个会话开始生效。顺带
  说出的纠正和长期规则也以同样方式捕获，并附一行 note 说明存了什么。
- **`/memories`** 在会话里配置 memory 的使用与生成。
- **Agent 也会读 memory。** 模型可以用它的 memory 工具显式地列出、读取和
  检索 memory，而且你现有内容的紧凑摘要会注入每个会话，让它继续之前先
  召回旧知识。

Memory 相关的一切默认开启、且可逐项配置——`memories.generate_memories`
关闭自动捕获，只留显式工具调用。设置见
[Memory、压缩与运行时特性](/zh/config/memory-and-runtime-features)。

## 为什么检索能跨语言

你可以用中文写一条 memory，在英文会话里召回它。搜索由 SQLite 全文索引
驱动，配有中文和日文的分词词典，所以匹配能跨语言边界，而不是要求同一种
文字。

## 它如何配合长会话

Memory 是持久层；当前对话靠压缩保持可读——在触到上下文上限之前先总结
transcript。`/compact` 手动触发它。那一半读
[上下文与压缩](/zh/guide/context-and-compaction)，完整机制——流水线各
阶段、读取路径和 note 生命周期——读
[Memory 原理与机制](/zh/guide/memory-internals)。

## 接下来去哪

- [Memory 原理与机制](/zh/guide/memory-internals) — 捕获、合并与检索究竟
  怎么工作。
- [上下文与压缩](/zh/guide/context-and-compaction) — 长会话。
- [Memory、压缩与运行时特性](/zh/config/memory-and-runtime-features) —
  每一项 memory 设置。
