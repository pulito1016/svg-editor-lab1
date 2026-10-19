# SVG 编辑器 CLI（Lab1 Phase 1）

TypeScript 实现的命令行 SVG 编辑器。支持 rect、circle、ellipse、line、text、g 六种类型，以及嵌套容器、读写 SVG、撤销重做。

## 运行

需要 Node.js 20 或更新版本及 pnpm。进入工程目录后：

```bash
pnpm install
pnpm build
pnpm test
pnpm cli
```

也可以用 npm：`npm install`、`npm run build`、`npm test`、`npm run cli`。

在 `svg>` 提示符下输入 `help` 查看命令。以 `#` 开头的行是注释；带空格的文字用双引号。非交互模式可回放示例：

```bash
pnpm cli < examples/flowchart.cli
```

这会生成 `examples/flowchart.svg`，可用浏览器直接打开。

## 目录

- `src/model/`：图形类层次、容器、文档、形状工厂
- `src/commands/`：编辑命令及历史
- `src/session/`：当前文档与 IO 边界
- `src/io/`：SVG XML 解析和序列化
- `src/cli/`：词法解析、命令路由、REPL
- `test/`：集成测试
- `doc/README.md`：老师要求的架构、过程和自查文档

本阶段不实现插件类型 `box`；`create box` 会返回规定的未知类型错误。读入支持六种内置图形及其常用几何和样式属性。
