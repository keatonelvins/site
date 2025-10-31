## Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## MDX Styling

All prose elements are automatically styled. Enhanced features:

- **Headings** - Auto-anchor links
- **Lists** - Custom ordered (italic counters) & unordered styling
- **Code** - Dual-theme syntax highlighting (github-light/dark)
- **Blockquotes** - Minimal border styling
- **Details** - Collapsible with animated arrows

```mdx
## Heading with anchor

- List item
- Task list: [ ] todo

> Blockquote

`inline code`

<details>
<summary>Collapsible section</summary>
Hidden content
</details>
```
