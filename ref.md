Directory structure:
└── keatonelvins-keat.one/
    └── src/
        ├── env.d.ts
        ├── build-time/
        │   ├── asidesPlugin.ts
        │   ├── derivedTitleAndDatePlugin.ts
        │   ├── index.ts
        │   └── urlOutsideOfPagesDirPlugin.ts
        ├── global-styles/
        │   ├── base.css
        │   ├── controls.css
        │   ├── font.css
        │   └── shiki.css
        ├── layouts/
        │   ├── BaseLayout.astro
        │   └── PostLayout.astro
        ├── lib/
        │   ├── CommandCenter.tsx
        │   ├── Commands.tsx
        │   ├── Dialog.tsx
        │   ├── Link.tsx
        │   ├── ScrollbarStyles.astro
        │   ├── Shortcut.tsx
        │   ├── utils.ts
        │   ├── color-scheme/
        │   │   ├── index.ts
        │   │   └── InitColorScheme.astro
        │   ├── overlay/
        │   │   └── Overlay.astro
        │   ├── prose/
        │   │   ├── Blockquote.module.css
        │   │   ├── Blockquote.tsx
        │   │   ├── code-and-pre.module.css
        │   │   ├── code-and-pre.tsx
        │   │   ├── Heading.module.css
        │   │   ├── Heading.tsx
        │   │   ├── Image.astro
        │   │   ├── Image.css
        │   │   ├── Ol.module.css
        │   │   ├── Ol.tsx
        │   │   ├── Paragraph.module.css
        │   │   ├── Paragraph.tsx
        │   │   ├── prose.css
        │   │   ├── Table.module.css
        │   │   ├── Table.tsx
        │   │   ├── Ul.module.css
        │   │   └── Ul.tsx
        │   └── TableOfContents/
        │       ├── HeadingsIntersectionHighlight.tsx
        │       ├── PostProgressBar.tsx
        │       └── TableOfContents.astro
        ├── pages/
        │   ├── [...path].astro
        │   └── index.astro
        └── types/
            └── index.ts


Files Content:

================================================
FILE: src/env.d.ts
================================================
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../.astro/types.d.ts" />
/// <reference path="astro/client" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * - `https://localhost:3000/` in development
   * - `https://${branch-name}--keat-one.vercel.app/` in preview
   * - `https://keat-one.vercel.app/` in production
   *
   * @see import.meta.env.SITE for the canonical URL
   */
  readonly PUBLIC_URL: string;
}



================================================
FILE: src/build-time/asidesPlugin.ts
================================================
import type * as hast from "hast";
import type { Plugin } from "unified";

export const FLEX_CONTAINER_CLASS = "post-aside";

export type AsidesPluginOptions = {};

/**
 * Wraps `aside` elements with previous sibling in a flex container.
 */
export const asidesPlugin: Plugin<[AsidesPluginOptions], Root, Root> = (
  _options,
) => {
  return (root) => {
    let children = [...root.children];

    const childrenToRemove: Set<RootContent> = new Set();

    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (!node) continue;
      if (node.type === "mdxJsxFlowElement" && node.name === "aside") {
        let lastAsideIndex = 0;
        for (let j = i - 1; j >= lastAsideIndex; j--) {
          const prev = children[j];
          if (!prev) continue;
          if (prev.type === "element") {
            childrenToRemove.add(node);
            lastAsideIndex = i;

            children[j] = {
              type: "mdxJsxFlowElement",
              name: "div",
              position: prev.position,
              data: prev.data,
              attributes: [
                {
                  type: "mdxJsxAttribute",
                  name: "className",
                  value: FLEX_CONTAINER_CLASS,
                },
              ],
              children: [
                {
                  type: "element",
                  tagName: "div",
                  children: [prev],
                  properties: {},
                },
                node,
              ],
            };

            break;
          }
        }
      }
    }

    children = children.filter((node) => !childrenToRemove.has(node));

    return { ...root, children };
  };
};

interface RootContentMap extends hast.RootContentMap {
  mdxJsxFlowElement: MdxJsxFlowElement;
}

type RootContent = RootContentMap[keyof RootContentMap];

interface Root {
  type: "root";
  children: RootContent[];
}

interface ElementContentMap extends hast.ElementContentMap {
  mdxJsxFlowElement: MdxJsxFlowElement;
}

type ElementContent = ElementContentMap[keyof ElementContentMap];

interface MdxJsxFlowElement {
  type: "mdxJsxFlowElement";
  name: string;
  attributes: { type: "mdxJsxAttribute"; name: string; value: unknown }[];
  children: ElementContent[];
  position?:
    | undefined
    | {
        start: { line: number; column: number; offset?: number | undefined };
        end: { line: number; column: number; offset?: number | undefined };
      };
  data?: unknown;
}



================================================
FILE: src/build-time/derivedTitleAndDatePlugin.ts
================================================
import type { Plugin } from "unified";
import type { PostFrontmatter, PostProps } from "../types";

export const derivedTitleAndDatePlugin: Plugin<
  [{ title: (fileStem: string) => string }]
> = ({ title }) => {
  return (_tree, file) => {
    const data = file.data as { astro: PostProps };
    const frontmatter = data.astro.frontmatter as Partial<PostFrontmatter>;

    if (!frontmatter.title) {
      frontmatter.title = title(file.stem || "");
    }
  };
};


================================================
FILE: src/build-time/index.ts
================================================
import { resolve } from "node:path";
import remarkSupersub from "remark-supersub";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { PluggableList } from "unified";

import { titleCase } from "../lib/utils";

import { asidesPlugin } from "./asidesPlugin";
import { derivedTitleAndDatePlugin } from "./derivedTitleAndDatePlugin";
import { urlOutsideOfPagesDirPlugin } from "./urlOutsideOfPagesDirPlugin";

export const remarkPlugins = (projectDir: string): PluggableList => {
  return [
    [
      urlOutsideOfPagesDirPlugin,
      { absoluteDirPath: resolve(projectDir, "./posts") },
    ],
    [derivedTitleAndDatePlugin, { title: titleCase }],
    remarkSupersub,
    remarkMath,
  ];
};

export const rehypePlugins: PluggableList = [[asidesPlugin, {}], rehypeKatex];



================================================
FILE: src/build-time/urlOutsideOfPagesDirPlugin.ts
================================================
import { relative } from "node:path";
import type { Plugin } from "unified";

import type { PostProps } from "../types";

export const urlOutsideOfPagesDirPlugin: Plugin<
  [{ absoluteDirPath: string }]
> = ({ absoluteDirPath }) => {
  return (_tree, file) => {
    const props = (file.data as { astro: PostProps }).astro;

    // We can't assign to `props.url` so we take `frontmatter.path`
    props.frontmatter.path =
      "/" +
      relative(absoluteDirPath, file.path)
        .replace(/\\/g, "/")
        .replace(file.extname || "", "")
        .replace(/ /g, "-");
  };
};



================================================
FILE: src/global-styles/base.css
================================================
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  touch-action: manipulation;

  scroll-behavior: smooth;

  font-size: 16px;

  &.dark {
    color-scheme: dark;
  }
}

:root {
  --color-background: 255 255 255;
  --color-foreground: 31 41 55;
  --color-muted: 107 114 128;
  --color-surface: 249 250 251;
  --color-border: 229 231 235;
  --color-accent: 240 74 0;
  --color-accent-foreground: 255 255 255;
}

.dark {
  --color-background: 12 18 10;
  --color-foreground: 216 222 212;
  --color-muted: 140 150 140;
  --color-surface: 18 26 15;
  --color-border: 28 45 24;
  --color-accent: 255 216 0;
  --color-accent-foreground: 17 24 39;
}

* {
  @apply outline-black dark:outline-white selection:bg-accent/20 selection:text-foreground;
}

body {
  @apply relative min-h-screen bg-background px-0 pb-20 pt-4 text-foreground md:px-4 md:pb-48 md:pt-8 font-serif;
}

body,
html {
  overflow-x: hidden;
}



================================================
FILE: src/global-styles/controls.css
================================================
.hover-before {
  @apply relative before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-transparent before:content-[''];
}

@media (hover: hover) {
  .hover-before:hover {
    @apply text-accent-foreground decoration-transparent;
  }

  .hover-before:hover::before {
    @apply bg-accent;
  }
}

/* MDX integrations */

.footnotes {
  & .data-footnote-backref {
    /* Without this, footnote back references will be rendered with an emoji. */
    @apply font-serif;
  }

  & ol > li > p {
    @apply -mx-1 inline;
  }
}



================================================
FILE: src/global-styles/font.css
================================================
@font-face {
  font-family: "Sentient";
  font-style: normal;
  font-display: swap;
  font-weight: 200 700;
  src: url("/fonts/Sentient/Sentient-Variable.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
    U+FEFF, U+FFFD;
}

@font-face {
  font-family: "Sentient";
  font-style: italic;
  font-display: swap;
  font-weight: 200 700;
  src: url("/fonts/Sentient/Sentient-VariableItalic.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
    U+FEFF, U+FFFD;
}

@font-face {
  font-family: "Switzer";
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url("/fonts/Switzer/Switzer-Variable.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
    U+FEFF, U+FFFD;
}

@font-face {
  font-family: "Switzer";
  font-style: italic;
  font-display: swap;
  font-weight: 100 900;
  src: url("/fonts/Switzer/Switzer-VariableItalic.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
    U+FEFF, U+FFFD;
}



================================================
FILE: src/global-styles/shiki.css
================================================
/* Astro's built-in Shiki uses .astro-code class */
.astro-code.github-dark {
  display: none;
}

html.dark {
  & .astro-code.github-light {
    display: none;
  }
  & .astro-code.github-dark {
    display: block;
  }
}

.astro-code.github-light,
.astro-code.github-dark {
  background-color: transparent !important;
  color: inherit !important;
}

pre.astro-code {
  @apply -mx-4 overflow-x-auto p-4 text-sm md:rounded-md;
  padding-right: calc(1rem - 1px);
  tab-size: 2;
}

pre.astro-code code {
  white-space: pre;
  -webkit-overflow-scrolling: touch;
}



================================================
FILE: src/layouts/BaseLayout.astro
================================================
---
import InitColorScheme from "../lib/color-scheme/InitColorScheme.astro";
import { Commands } from "../lib/Commands";
import Overlay from "../lib/overlay/Overlay.astro";
import { Link } from "../lib/Link";
import ScrollbarStyles from "../lib/ScrollbarStyles.astro";
import type { PostFrontmatter } from "../types";
import Analytics from "@vercel/analytics/astro";

import "../global-styles/base.css";
import "../global-styles/controls.css";
import "../global-styles/font.css";
import "../lib/prose/prose.css";

interface Props {
  title: string;
  description: string;
  children: astroHTML.JSX.Element;
}

const { title, description } = Astro.props;

const posts = (await Astro.glob<PostFrontmatter>("../../posts/**/*.mdx"))
  .filter((p) => (import.meta.env.PROD ? !p.frontmatter.draft : true))
  .map((p) => ({
    href: p.frontmatter.path,
    title: p.frontmatter.title,
    date: p.frontmatter.date,
  }));

posts.sort((a, b) => {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
});
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <Analytics />
    <link rel="preload" href="/fonts/Sentient/Sentient-Variable.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/Sentient/Sentient-VariableItalic.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/Switzer/Switzer-Variable.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/Switzer/Switzer-VariableItalic.woff2" as="font" type="font/woff2" crossorigin />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">

    <title>{title}</title>
    <InitColorScheme />
  </head>
  <body>
    <div class="mx-auto max-w-container px-4">
      <header
        class="-mt-2 flex items-center justify-between"
        style={{ height: "37.5px" }}
      >
        <slot name="header-content">
          <Link href="/">← back</Link>
        </slot>
        <Commands client:load posts={posts} />
      </header>
      <slot />
      <Overlay />
    </div>
    <ScrollbarStyles />
  </body>
</html>



================================================
FILE: src/layouts/PostLayout.astro
================================================
---
import type { MarkdownLayoutProps } from "astro";

import Image from "../lib/prose/Image.astro";
import TableOfContents from "../lib/TableOfContents/TableOfContents.astro";
import type { PostFrontmatter } from "../types";

import BaseLayout from "./BaseLayout.astro";

import "../global-styles/shiki.css";

interface Props extends Omit<MarkdownLayoutProps<{}>, "frontmatter"> {
  frontmatter: PostFrontmatter;
}

const { frontmatter, headings } = Astro.props;

const date = new Date(frontmatter.date);
const imgSrc =
  typeof frontmatter.img === "object" ? frontmatter.img.src : frontmatter.img;
const description = frontmatter.description || ""
---

<BaseLayout title={frontmatter.title} description={description}>
  <main class="prose py-4">
    <header
      class="flex justify-between items-start sm:items-center flex-col sm:flex-row"
    >
      <h1 class="!my-0">{frontmatter.title}</h1>
      <div class="text-gray-600 dark:text-gray-400 text-right">
        <time
          datetime={date.toISOString()}
          class="tabular-nums tracking-tighter"
        >
          {new Date(date).toLocaleDateString("sv-SE")}
        </time>
      </div>
    </header>
    {
      imgSrc && (
        <Image alt="" src={imgSrc} format="webp" width={774} aspectRatio={2} />
      )
    }
    <slot />
  </main>
  <TableOfContents headings={headings} />
  <style is:global>
     {
      /* make the spacing even when there's no callout nor image */
    }
    .prose > header + :is(p, .post-aside) {
      margin-top: 2em;
    }
  </style>
</BaseLayout>



================================================
FILE: src/lib/CommandCenter.tsx
================================================
import {
  children,
  createContext,
  createEffect,
  createMemo,
  createRenderEffect,
  createSelector,
  createSignal,
  createUniqueId,
  type JSX,
  onCleanup,
  Show,
  splitProps,
  useContext,
} from "solid-js";

import { Dialog, type DialogProps } from "./Dialog";

type CommandCenterCtx = {
  listId: string;
  inputId: string;
  setDialogRef: (ref: HTMLDialogElement | undefined) => void;
  open: () => void;
  isSelected: (command: string) => boolean;
  matchesFilter: (command: string) => boolean;
  onInput: (filter: string) => void;
  selectOption: (element: HTMLElement) => void;
  onSelectedUnmount: () => void;
  getInputValue: () => string;
};
const CommandCenterCtx = createContext<CommandCenterCtx>({
  inputId: "",
  listId: "",
  setDialogRef: () => {},
  open: () => {},
  isSelected: () => false,
  matchesFilter: () => true,
  onInput: () => {},
  selectOption: () => {},
  onSelectedUnmount: () => {},
  getInputValue: () => "",
});

export const useCommandCenterCtx = () => useContext(CommandCenterCtx);

export interface CommandCenterTriggerProps
  extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: (event: MouseEvent) => void;
}
export function CommandCenterTrigger(props: CommandCenterTriggerProps) {
  const ctx = useCommandCenterCtx();

  return (
    <button
      {...props}
      onClick={(event) => {
        ctx.open();
        props.onClick?.(event);
      }}
    >
      ⌘
    </button>
  );
}

export interface CommandCenterProps {
  children: JSX.Element;
  inputId?: string;
}

export function CommandCenter(props: CommandCenterProps) {
  const dialogRef = {
    current: undefined as HTMLDialogElement | undefined,
  };
  let inputId = createUniqueId();
  const listId = createUniqueId();

  if (props.inputId) {
    inputId = props.inputId;
  }

  const [inputValue, onInput] = createSignal("");
  const [selectedCommand, selectCommand] = createSignal<string>("");
  const isSelected = createSelector(selectedCommand);

  const match = (option: string, pattern: string) => {
    return option.toLowerCase().includes(pattern.toLowerCase());
  };

  const matchesFilter = createSelector<string, string>(inputValue, match);

  const getOptions = (): HTMLElement[] =>
    Array.from(dialogRef.current?.querySelectorAll('[role="option"]') || []);

  createEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog || !dialog.open) return;

      let move: -1 | 1;

      switch (event.key) {
        case "ArrowUp":
          move = -1;
          break;

        case "ArrowDown":
          move = 1;
          break;

        default:
          return;
      }

      document.getElementById(inputId)?.focus();

      selectCommand((prev) => {
        const commands = getOptions();
        const current: HTMLElement | null = dialog.querySelector(
          '[aria-selected="true"]',
        );

        if (!current) {
          const next = move === 1 ? commands[0] : commands.at(-1);

          if (!next) return prev;
          return getCommandText(next);
        }

        const index = commands.indexOf(current);
        const nextIndex = (index + move + commands.length) % commands.length;

        return getCommandText(commands[nextIndex]!);
      });
    };

    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      window.removeEventListener("keydown", onKeyDown);
    });
  });

  return (
    <CommandCenterCtx.Provider
      value={{
        listId,
        inputId,
        setDialogRef: (ref) => {
          dialogRef.current = ref;

          ref?.addEventListener("close", () => {
            selectCommand("");
            onInput("");
            (document.getElementById(inputId) as HTMLInputElement).value = "";
          });
        },
        open: () => {
          dialogRef.current?.showModal();
        },
        isSelected,
        matchesFilter,
        onInput: (pattern) => {
          onInput(pattern);

          if (!match(selectedCommand(), pattern)) {
            for (const element of getOptions()) {
              const text = getCommandText(element);
              if (match(text, pattern)) {
                selectCommand(text);
                break;
              }
            }
          }
        },
        selectOption: (element) => selectCommand(getCommandText(element)),
        onSelectedUnmount: () => selectCommand(""),
        getInputValue: inputValue,
      }}
    >
      {props.children}
    </CommandCenterCtx.Provider>
  );
}

export interface CommandGroupProps {
  heading?: JSX.Element;
  children: JSX.Element;
}

export function CommandGroup(props: CommandGroupProps) {
  const headingId = createUniqueId();
  const { matchesFilter } = useCommandCenterCtx();

  const kids = children(() => props.children);
  const allChildrenAreHidden = createMemo(() => {
    const ks = (Array.isArray(kids()) ? kids() : [kids()]) as HTMLElement[];

    return ks.every((element) => !matchesFilter(getCommandText(element)));
  });

  return (
    <>
      <Show when={!!props.heading}>
        <div
          aria-hidden
          id={headingId}
          style={{ display: allChildrenAreHidden() ? "none" : "" }}
        >
          {props.heading}
        </div>
      </Show>
      <div
        role="group"
        {...(props.heading && { "aria-labelledby": headingId })}
      >
        {props.children}
      </div>
    </>
  );
}

export interface CommandItemProps extends JSX.HTMLAttributes<HTMLElement> {
  children: JSX.Element;
  href?: string | undefined;
}

export function CommandItem(props: CommandItemProps) {
  const [own, rest] = splitProps(props, ["href"]);
  const { isSelected, matchesFilter, onSelectedUnmount } =
    useCommandCenterCtx();

  const res = (
    own.href ? (
      <a
        href={own.href}
        role="option"
        aria-selected="false"
        {...(rest as JSX.HTMLAttributes<HTMLAnchorElement>)}
      >
        {props.children}
      </a>
    ) : (
      <button
        type="button"
        role="option"
        aria-selected="false"
        {...(rest as JSX.HTMLAttributes<HTMLButtonElement>)}
      >
        {props.children}
      </button>
    )
  ) as HTMLElement;

  createEffect(() => {
    const text = getCommandText(res);

    const selected = isSelected(text);
    res.ariaSelected = String(selected);
    res.style.display = matchesFilter(text) ? "" : "none";

    const isVisible = matchesFilter(text);

    res.style.display = isVisible ? "" : "none";
    res.role = isVisible ? "option" : "none";

    if (selected) {
      setTimeout(
        () => res.scrollIntoView({ block: "center", behavior: "smooth" }),
        0,
      );
      onCleanup(() => {
        if (isSelected(text)) onSelectedUnmount();
      });
    }
  });

  return res;
}

export interface CommandInputProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "onChange" | "id"> {
  "aria-label": string;
}

export function CommandInput(props: CommandInputProps) {
  const ctx = useCommandCenterCtx();

  return (
    <input
      autocomplete="off"
      onInput={(event) => {
        ctx.onInput(event.currentTarget.value);
      }}
      {...{
        /**
         * Safari only
         * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#autocorrect
         */
        autocorrect: "off",
      }}
      spellcheck={false}
      aria-autocomplete="list"
      role="combobox"
      aria-expanded={true}
      aria-controls={ctx.listId}
      id={ctx.inputId}
      type="text"
      {...props}
    />
  );
}

export interface CommandCenterDialogProps extends DialogProps {
  ref?: (ref: HTMLDialogElement | undefined) => void;
}

export function CommandCenterDialog(props: CommandCenterDialogProps) {
  const ctx = useCommandCenterCtx();

  return (
    <Dialog
      {...props}
      style={{
        margin: "0 auto",
        position: "fixed",
        "max-height": "361px",
      }}
      classList={{
        ...props.classList,
        "top-[4.5rem] sm:top-[calc(50%-180px)]": true,
      }}
      ref={(dialog) => {
        ctx.setDialogRef(dialog);
        props.ref?.(dialog);
      }}
    />
  );
}

function getCommandText(element: HTMLElement) {
  return element.textContent || element.innerText;
}

export function CommandList(
  props: Omit<JSX.HTMLAttributes<HTMLDivElement>, "id">,
) {
  const { listId, isSelected, selectOption } = useCommandCenterCtx();

  createRenderEffect(() => {
    const nothingSelected = isSelected("");
    const kids = children(() => props.children).toArray();

    if (nothingSelected) {
      for (const child of kids) {
        if (child instanceof HTMLElement) {
          if (child.role === "option") {
            selectOption(child);
            break;
          }

          const first: HTMLElement | null =
            child.querySelector("[role=option]");

          if (first) {
            selectOption(first);
            break;
          }
        }
      }
    }
  });

  return <div id={listId} {...props} />;
}



================================================
FILE: src/lib/Commands.tsx
================================================
import {
  createEffect,
  createSignal,
  type JSX,
  Match,
  onCleanup,
  onMount,
  Show,
  splitProps,
  Switch,
} from "solid-js";

import { type ColorScheme, setScheme } from "./color-scheme";
import {
  CommandCenter,
  CommandCenterDialog,
  CommandCenterTrigger,
  CommandGroup,
  CommandInput,
  CommandItem as CommandCenterItem,
  type CommandItemProps as CommandCenterItemProps,
  CommandList,
  useCommandCenterCtx,
} from "./CommandCenter";
import { DialogCloseButton } from "./Dialog";
import { parseKeys } from "./utils";
import { Shortcut } from "./Shortcut";

const INPUT_ID = "command-input";

export function Commands({
  posts,
}: {
  posts: { title: string; href: string }[];
}) {
  const [clientside, setClientside] = createSignal(false);
  onMount(() => setClientside(true)); // workaround for Astro + Solid Hydration issue

  return (
    <CommandCenter inputId={INPUT_ID}>
      <CommandCenterTrigger class="hover-before -mx-4 h-12 w-12 rounded-sm text-muted hover:text-foreground" />
      <Show when={clientside()} keyed>
        <CommandsPalette posts={posts} />
      </Show>
    </CommandCenter>
  );
}

export function CommandsPalette({
  posts,
}: {
  posts: { title: string; href: string }[];
}) {
  type CommandsPage = "posts" | "theme" | undefined;
  const { getInputValue } = useCommandCenterCtx();

  const [page, setPage] = createSignal<CommandsPage>();
  let dialog: HTMLDialogElement | undefined;

  const setColorScheme = (scheme: ColorScheme) => {
    if (page() !== "theme") return;
    setScheme(scheme);
    dialog?.close();
  };

  const getSelected = () =>
    dialog?.querySelector('[aria-selected="true"]') as HTMLElement | null;

  const keybindings = new Map<string, () => void>([
    [
      "escape",
      () => {
        if (dialog?.open) {
          dialog.close();
        }
        setPage(undefined);
      },
    ],
    [
      "backspace",
      () => {
        if (!getInputValue()) setPage(undefined);
      },
    ],
    [
      "enter",
      () => {
        if (document.activeElement?.id === INPUT_ID) {
          getSelected()?.click();
        }
      },
    ],
    [
      "alt+t",
      () => {
        if (dialog && !dialog.open) dialog.showModal();
        setPage("theme");
      },
    ],
    [
      "cmd+k",
      () => {
        if (dialog) {
          if (dialog.open) dialog.close();
          else dialog.showModal();
        }
      },
    ],
    ["1", () => setColorScheme("light")],
    ["2", () => setColorScheme("dark")],
    ["3", () => setColorScheme(null)],
    [
      "alt+slash",
      () => {
        if (dialog && !dialog.open) dialog.showModal();
        document.getElementById(INPUT_ID)?.focus();
        setPage("posts");
      },
    ],
  ]);

  createEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      const cmdKey = window.navigator.platform.toUpperCase().includes("MAC") ? event.metaKey : event.ctrlKey;
      const { shiftKey, altKey } = event;

      const modifiers = [cmdKey && "cmd", shiftKey && "shift", altKey && "alt"];

      const { code, key } = parseKeys(event);

      const found =
        keybindings.get(plus(...modifiers, code)) ||
        keybindings.get(plus(...modifiers, key));

      if (found) {
        if (cmdKey || altKey || (key === "escape" && dialog?.open)) {
          event.preventDefault();
        }
        found();
      }
    };

    window.addEventListener("keydown", onKeydown);

    onCleanup(() => window.removeEventListener("keydown", onKeydown));
  });

  const handleShortcut = (shortcut: string) => keybindings.get(shortcut)?.();

  return (
    <CommandCenterDialog
      onClose={() => setPage(undefined)}
      ref={(ref) => (dialog = ref)}
      class={
        "relative mx-auto w-96 max-w-full transform flex-col overflow-hidden rounded-xl bg-surface p-0 shadow-2xl ring-1 ring-black ring-opacity-5 transition-all backdrop:bg-white backdrop:bg-opacity-30 [&[open]]:flex"
      }
    >
      <div class="flex justify-end">
        <DialogCloseButton class="group cursor-pointer p-2 focus:outline-none">
          <kbd 
            aria-hidden
            class="rounded-md border border-b-2 bg-surface p-1 border-border text-xs leading-none tracking-tighter text-foreground"
          >esc</kbd>
          <span class="sr-only">Close</span>
        </DialogCloseButton>
      </div>
      <CommandInput
        aria-label="Commands"
        class="relative w-full bg-transparent p-2 indent-2 focus:outline-none"
        placeholder="What do you need?"
        autofocus
      />
      <div class="mx-2 border-b border-border" />
      <CommandList class="overflow-scroll p-2">
        <Switch
          fallback={
            <>
              <CommandItem shortcut="alt+t" onClick={handleShortcut}>
                set theme
              </CommandItem>
              <CommandGroup heading={<GroupHeading>posts</GroupHeading>}>
                <CommandItem shortcut="alt+slash" onClick={handleShortcut}>
                  search
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading={<GroupHeading>links</GroupHeading>}>
                <CommandItem href="https://x.com/KeatonElvins">
                  x
                </CommandItem>
                <CommandItem href="https://github.com/keatonelvins">
                  github
                </CommandItem>
                <CommandItem href="https://sites.google.com/view/myfuji/">
                  ephemera
                </CommandItem>
              </CommandGroup>
            </>
          }
        >
          <Match when={page() === "theme"}>
            <CommandItem shortcut="1" onClick={handleShortcut}>
              set theme to light
            </CommandItem>
            <CommandItem shortcut="2" onClick={handleShortcut}>
              set theme to dark
            </CommandItem>
            <CommandItem shortcut="3" onClick={handleShortcut}>
              set theme to system
            </CommandItem>
          </Match>
          <Match when={page() === "posts"}>
            <CommandGroup heading={<GroupHeading>Posts</GroupHeading>}>
              {posts.map((p) => (
                <CommandItem href={p.href}>{p.title}</CommandItem>
              ))}
            </CommandGroup>
          </Match>
        </Switch>
      </CommandList>
    </CommandCenterDialog>
  );
}

interface CommonCommandItemProps
  extends Omit<CommandCenterItemProps, "onClick"> {}
export type CommandItemProps = CommonCommandItemProps &
  (
    | {
        href?: never;
        shortcut: string;
        onClick: (shortcut: string) => void;
      }
    | { href: string; shortcut?: never; onClick?: never }
  );

function CommandItem(props: CommandItemProps) {
  const [own, rest] = splitProps(props, ["shortcut", "children", "onClick"]);

  const content = (
    <>
      {own.children}
      <Show when={own.shortcut} keyed>
        {(shortcut) => <Shortcut class="ml-1" shortcut={shortcut} />}
      </Show>
    </>
  );

  return (
    <CommandCenterItem
      class={
        "hover-before relative flex w-full cursor-pointer justify-between p-2 text-foreground focus-visible:outline-black"
      }
      tabIndex={-1}
      onClick={() => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        if (own.shortcut) own.onClick!(own.shortcut);
      }}
      {...rest}
    >
      {content}
    </CommandCenterItem>
  );
}

function GroupHeading(props: { children: JSX.Element }) {
  return (
    <span class="p-2 text-xs font-semibold uppercase leading-none tracking-wider text-muted">
      {props.children}
    </span>
  );
}

function plus(...xs: (string | boolean | undefined | null)[]) {
  return xs.filter(Boolean).join("+");
}



================================================
FILE: src/lib/Dialog.tsx
================================================
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { createEffect, type JSX, splitProps } from "solid-js";

import { useFocusTrap } from "./utils";

export interface DialogProps
  extends JSX.DialogHtmlAttributes<HTMLDialogElement> {
  open?: boolean;
  onClose?: () => void;
  children: JSX.Element;
  ref?: (dialog: HTMLDialogElement) => void;
}

export function Dialog(props: DialogProps) {
  const [own, rest] = splitProps(props, ["children", "ref"]);
  const dialogRef: { current: HTMLDialogElement | undefined } = {
    current: undefined,
  };

  useFocusTrap(dialogRef);

  createEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      const observer = new MutationObserver(() => {
        document.body.style.overflow = dialog.open ? "hidden" : "";
      });

      observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    }
  });

  const dismissOnBackdropClick: JSX.EventHandler<
    HTMLDialogElement,
    MouseEvent
  > = (event) => {
    if (event.target === event.currentTarget) {
      event.currentTarget.close("dismiss");
      props.onClose?.();
    }
  };

  return (
    <dialog
      onClick={dismissOnBackdropClick}
      ref={(dialog) => {
        dialogRef.current = dialog;
        own.ref?.(dialog);
      }}
      {...rest}
    >
      {own.children}
    </dialog>
  );
}

export interface DialogCloseButtonProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "value"> {}

export function DialogCloseButton(props: DialogCloseButtonProps) {
  return (
    <button
      onClick={(event) => {
        event.currentTarget.closest("dialog")?.close("dismiss");
      }}
      {...props}
    />
  );
}



================================================
FILE: src/lib/Link.tsx
================================================
import { type JSX, splitProps } from "solid-js";

export interface LinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  noUnderline?: boolean;
}

export function Link(props: LinkProps) {
  const [own, rest] = splitProps(props, ["classList", "noUnderline"]);

  const childIsImg = isChildAnImage(rest.children);

  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a
      classList={{
        ...own.classList,
        "underline underline-offset-4 decoration-gray-200 dark:decoration-gray-700 hover:decoration-transparent dark:hover:decoration-transparent focus:decoration-transparent dark:focus:decoration-transparent": !own.noUnderline,
        "p-1 -mx-1 relative": true,
        "hover-before": true,
        "clean-image-box": childIsImg,
      }}
      {...rest}
    />
  );
}

function isChildAnImage(children: JSX.Element) {
  if (!children || typeof children !== "object") return false;

  // A child can be a JSX element or an stringified Astro slot.
  if ("type" in children) return children.type === "img";
  if ("t" in children) {
    let t = children.t as string;
    if (t.startsWith("<astro-")) {
      t = t.slice(t.indexOf(">") + 1, -1);
      t = t.trim();
    }
    return t.startsWith(`<img `) || t.startsWith(`<span clean-image`);
  }

  return false;
}



================================================
FILE: src/lib/ScrollbarStyles.astro
================================================
---
// We add .bars class instead of adding .mac class, because we really want to
// avoid scrollbars blinking in and out.
---

<script is:inline>
  if (!navigator.userAgent.includes("Mac OS"))
    document.documentElement.classList.add("bars");
</script>

<style is:global>
  html.bars {
    --scrollbar-color: var(--color-accent);

    & ::-webkit-scrollbar {
      width: 15px;
    }

    & ::-webkit-scrollbar-track:hover {
      background-color: rgba(var(--scrollbar-color), 0.02);
    }

    & ::-webkit-scrollbar-thumb {
      background-color: rgba(var(--scrollbar-color), 0.2);
      background-clip: padding-box;
      border: 3px solid rgba(var(--scrollbar-color), 0);
      border-radius: 100px;
    }

    & ::-webkit-scrollbar-thumb:hover {
      border-width: 3px;
      background-color: rgba(var(--scrollbar-color), 0.32);
    }

    & ::-webkit-scrollbar-corner {
      background-color: rgba(var(--scrollbar-color), 0);
    }
  }
</style>



================================================
FILE: src/lib/Shortcut.tsx
================================================
import type { JSX } from "solid-js";
import { For } from "solid-js";


export interface ShortcutProps extends JSX.HTMLAttributes<HTMLElement> {
  shortcut: string;
}

export function Shortcut(props: ShortcutProps) {
  // This component cannot be used on serverside;
  const IS_MAC = typeof window !== "undefined" && window.navigator.platform.toUpperCase().includes("MAC");

  return (
    <span
      {...props}
      class={props.class}
      classList={{
        ...props.classList,
        "inline-flex gap-1": true,
      }}
    >
      <For each={props.shortcut.split("+")}>
        {(key) => {
          let style = "";

          if (!IS_MAC && key === "cmd") {
            key = "ctrl";
          } else if (key === "shift") {
            style = "font-family: Inter";
            key = "⇧";
          } else if (key === "slash") {
            key = "/";
          }

          return (
            <kbd 
              style={style}
              class="rounded-md border border-b-2 bg-surface p-1 border-border text-xs leading-none tracking-tighter text-foreground"
            >
              {key}
            </kbd>
          );
        }}
      </For>
    </span>
  );
}



================================================
FILE: src/lib/utils.ts
================================================
import { createEffect, onCleanup } from "solid-js";

/**
 * Reads keys from KeyboardEvent in normalized form.
 *
 * e.g. pressing alt+t results in event.key `†` on my keyboard,
 * but `event.code` is `KeyT`, so we extract the `t` out of it.
 */
export function parseKeys(event: KeyboardEvent) {
  const code = event.code.replace(/^Key|^Digit/, "").toLowerCase();
  const key = event.key.toLowerCase();
  return { code, key };
}

export function titleCase(str: string) {
  return str.replace(/-/g, " ").toLowerCase();
}

const FOCUSABLE_ELEMENTS =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(ref: { current: HTMLElement | undefined }) {
  createEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const modal = ref.current;

      if (!modal) return;

      const focusableContent = modal.querySelectorAll(FOCUSABLE_ELEMENTS);
      const firstFocusableElement = focusableContent[0];
      const lastFocusableElement =
        focusableContent[focusableContent.length - 1];

      const isTabPressed = e.key === "Tab" || e.keyCode === 9;

      if (!isTabPressed) return;

      if (e.shiftKey) {
        if (
          document.activeElement === firstFocusableElement &&
          lastFocusableElement
        ) {
          if ("focus" in lastFocusableElement) {
            (lastFocusableElement as HTMLElement).focus();
            e.preventDefault();
          }
        }
      } else {
        if (
          document.activeElement === lastFocusableElement &&
          firstFocusableElement
        ) {
          if ("focus" in firstFocusableElement) {
            (firstFocusableElement as HTMLElement).focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);

    onCleanup(() => document.removeEventListener("keydown", onKeyDown));
  });
}




================================================
FILE: src/lib/color-scheme/index.ts
================================================
const STORAGE_KEY = "keat-one-color";

export type ColorScheme = "light" | "dark" | /* system */ null;

const setClass = (isDark: boolean) =>
  document.documentElement.classList.toggle("dark", isDark);

export const setScheme = (scheme: ColorScheme): void => {
  {
    let isDark: boolean;
    if (scheme) {
      if (window.ketcolormql) window.ketcolormql.onchange = null;

      isDark = scheme === "dark";
    } else {
      // This seems like a bug in TS ESLint.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const mql = (window.ketcolormql ||= window.matchMedia(
        "(prefers-color-scheme: dark)",
      ));

      mql.onchange = (e) => setClass(e.matches);
      isDark = mql.matches;
    }

    setClass(isDark);
  }

  if (typeof localStorage !== "undefined") {
    if (scheme) localStorage.setItem(STORAGE_KEY, scheme);
    else localStorage.removeItem(STORAGE_KEY);
  }
};

export const getStoredScheme = (): ColorScheme => {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY) as ColorScheme;
};

// Reading from localStorage and prefers-color-scheme
// and writing to documentElement.classList happens in InitializeColorScheme
export const getEffectiveScheme = (): "dark" | "light" => {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

declare global {
  interface Window {
    ketcolormql?: MediaQueryList;
  }
}



================================================
FILE: src/lib/color-scheme/InitColorScheme.astro
================================================
<script is:inline>
  const setClass = (isDark) =>
    document.documentElement.classList.toggle("dark", isDark);

  const scheme = localStorage.getItem("keat-one-color");

  if (!scheme) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setClass(mql.matches);
    mql.onchange = (e) => setClass(e.matches);
    window.ketcolormql = mql;
  } else setClass(scheme === "dark");
</script>



================================================
FILE: src/lib/overlay/Overlay.astro
================================================
---
import paperTexture from "./paper.png";
---

<div
  style={{ backgroundImage: `url(${paperTexture.src})` }}
  class="pointer-events-none absolute inset-0 z-50 select-none bg-repeat bg-[length:512px_512px] mix-blend-multiply dark:mix-blend-screen dark:invert opacity-40 dark:opacity-25"
></div>


================================================
FILE: src/lib/prose/Blockquote.module.css
================================================
.Blockquote {
  @apply font-serif text-[0.95em] font-[400] text-left border border-border p-4;
}



================================================
FILE: src/lib/prose/Blockquote.tsx
================================================
import type { JSX } from "solid-js";

import styles from "./Blockquote.module.css";

export function Blockquote(props: JSX.BlockquoteHTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      {...props}
      classList={{
        ...props.classList,
        [styles.Blockquote!]: true,
      }}
    />
  );
}



================================================
FILE: src/lib/prose/code-and-pre.module.css
================================================
.Code {
  @apply font-mono;
  /* We decrease letter spacing to make inline code stand out less from the
       surrounding text. */
  letter-spacing: -0.02em;
  font-size: 0.97em;

  &::before,
  &::after {
    @apply font-black text-gray-400;
    content: "`";

    :global(.dark) & {
      @apply text-gray-600;
    }
  }
}


================================================
FILE: src/lib/prose/code-and-pre.tsx
================================================
import type { JSX } from "solid-js";

import styles from "./code-and-pre.module.css";

export function Code(props: JSX.HTMLAttributes<HTMLElement>) {
  return (
    <code {...props} classList={{ ...props.classList, [styles.Code!]: true }} />
  );
}



================================================
FILE: src/lib/prose/Heading.module.css
================================================
.Heading {
  &:is(h1, h2, h3, h4, h5, h6) {
    margin-top: 2rem;
    margin-bottom: 1.5rem;

    @apply font-sans font-[555] text-[1em];

    &::before {
      @apply text-muted;
    }
  }

  &:is(h1)::before {
    content: "# ";
  }
  &:is(h2)::before {
    content: "## ";
  }
  &:is(h3)::before {
    content: "### ";
  }

  & > a::after {
    @apply transition-opacity;

    content: "🔗";
    display: inline-flex;
    height: 100%;
    margin-left: 0.5rem;
    font-size: 0.8rem;
    transform: translateY(-0.1rem);
    opacity: 0;
  }

  &:hover > a::after {
    opacity: 1;
  }
}



================================================
FILE: src/lib/prose/Heading.tsx
================================================
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable jsx-a11y/heading-has-content */

import { Show, splitProps } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { Dynamic } from "solid-js/web";

import styles from "./Heading.module.css";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface HeadingProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel;
}

export function Heading(props: HeadingProps) {
  const [own, rest] = splitProps(props, ["level", "children", "classList"]);

  return (
    <Dynamic<HeadingLevel>
      component={own.level}
      classList={{
        ...own.classList,
        [styles.Heading!]: true,
      }}
      {...rest}
    >
      <Show when={rest.id} fallback={own.children}>
        <a href={"#" + rest.id!}>{own.children}</a>
      </Show>
    </Dynamic>
  );
}

export function createHeading(level: HeadingLevel) {
  return (props: Omit<HeadingProps, "level">) => (
    <Heading level={level} {...props} />
  );
}



================================================
FILE: src/lib/prose/Image.astro
================================================
---
/**
 * @file Optimized Image component with placeholder
 *
 * This file started as a "fork" / "eject" of Image from `@astrojs/image`,
 * because I couldn't get its props to expose from an Image component that
 * would compose it.
 *
 * The `@ts-ignore` at the top of the original file didn't add much confidence too.
 *
 * @changes
 * - Added placeholder powered by `plaiceholder` CSS strategy.
 * - Limited the width of the image to wide container width, to get smaller & ligher images.
 */

import type { ImageMetadata, ImageTransform } from "astro";
import {
  getImage,
  type LocalImageProps,
  type RemoteImageProps,
} from "astro:assets";
import { readFile } from "node:fs/promises";
import { getPlaiceholder } from "plaiceholder";

import "./Image.css";

// All* images with `src`s starting from / are imported from `src/images/` folder.
const SRC_IMAGES_PREFIX = "/";

// Images with `src` starting with /content/ live in public dir.
const PUBLIC_IMAGES_PREFIX = "/content/";

// No image needs to be wider than this.
// TODO: Support High DPI screens by ensuring Astro emits images 2x of that.
const WIDE_CONTAINER_WIDTH = 774;

type LocalProps = LocalImageProps & {
  aspectRatio?: number | string;
};
type RemoteProps = RemoteImageProps & {
  aspectRatio?: number | string;
};
export type Props = LocalProps | RemoteProps;

const { loading = "lazy", decoding = "async", ...props } = Astro.props as Props;

let width = props.width;
let height = props.height;

let src = await props.src;
if (typeof src === "object") {
  if ("default" in src) src = src.default;
  if ("src" in src) {
    src = src.src;
  }
}

const pathToImage = decodeURIComponent(
  src.startsWith(SRC_IMAGES_PREFIX)
    ? `../../../src/images${src.slice(SRC_IMAGES_PREFIX.length - 1)}`
    : src,
);
let importedImage = null;

let placeholder: null | {
  backgroundImage: string;
  backgroundPosition: string;
  backgroundSize: string;
  backgroundRepeat: string;
} = null;

const isRaw = src.startsWith("raw!") || src.startsWith(PUBLIC_IMAGES_PREFIX);
if (isRaw) {
  src = src.slice(4);

  if (src.startsWith(PUBLIC_IMAGES_PREFIX)) {
    const globbed = import.meta.glob<false, string, { default: ImageMetadata }>(
      "../../../public/content/**/*",
    );
    const path = "../../../public" + src;
    const imported = (await globbed[path]!()).default;

    // I'm preserving the aspect ratio of the imported image, because
    // the 'raw' images can contain text or important details that should
    // not be cut off.
    height =
      parseFloat(props.width as string) /
      parseFloat(props.aspectRatio as string);
    props.aspectRatio = imported.width / imported.height;
    width = height * (imported.width / imported.height);
  }
} else {
  if (src.startsWith(SRC_IMAGES_PREFIX)) {
    src = src.slice(SRC_IMAGES_PREFIX.length - 1);
    const allImages = import.meta.glob<
      false,
      string,
      { default: ImageMetadata }
    >("../../../src/images/**/*");

    try {
      importedImage = (await allImages[pathToImage.replace("../src/", "")]!())
        .default;
    } catch (err) {
      console.error({ allImages, pathToImage });
      throw err;
    }
    props.width ??= importedImage.width;
    props.height ??= importedImage.height;
    if ((importedImage.format = "jpg")) importedImage.format = "webp";
  }

  const imageForPlaceholder = await (pathToImage.startsWith("http")
    ? fetch(pathToImage).then(async (res) =>
        Buffer.from(await res.arrayBuffer()),
      )
    : readFile(
        new URL(
          pathToImage.replace("../", ""),
          // this normalizes the path between prod and dev
          import.meta.url.replace("/src/", "/"),
        ),
      ));

  const { metadata, css } = await getPlaiceholder(imageForPlaceholder, {
    size: 10,
  });
  placeholder = css;

  if (!width && !height && !props.aspectRatio) {
    width ??= metadata.width;
    props.aspectRatio ??= metadata.width / metadata.height;
    width = Math.min(width, WIDE_CONTAINER_WIDTH);
    height = Math.round(width / parseFloat(props.aspectRatio as string));
  }
}

height ??=
  typeof props.aspectRatio === "number"
    ? parseFloat(width as unknown as string) / props.aspectRatio
    : undefined;

props.alt ||= "";
let attrs = { src, class: "", width, height, aspectRatio: props.aspectRatio };

if (!isRaw) {
  let attributes;
  props.src = src;
  ({ src, attributes } = await getImage({
    ...props,
    src: importedImage || src,
    format: "webp",
    width,
    height,
  } as ImageTransform));
  attrs = { ...attrs, ...attributes, src };
}
---

<span
  clean-image
  class:list={[
    "clean-image-box relative block overflow-hidden",
    !placeholder &&
      "bg-current/10 !inline-flex w-[var(--wide-content-width)] justify-center [&>img]:h-full [&>img]:object-contain",
  ]}
>
  <img
    {...attrs}
    class:list={["rounded-sm dark:opacity-80", attrs.class]}
    loading={loading}
    decoding={decoding}
  />
  {
    placeholder && (
      <span
        style={placeholder}
        class="absolute inset-0 -z-10 h-full w-full scale-150 transform blur-2xl filter dark:opacity-80"
      />
    )
  }
</span>



================================================
FILE: src/lib/prose/Image.css
================================================
/*
  - .clean-image-box class is also used in Link, so this is a global class
  - we use it twice here to bump the specificity over `.prose p a`
*/
.clean-image-box.clean-image-box {
  @apply inline-block rounded-sm;
  max-width: unset;
  transform: translateX(min(calc(-50% * var(--wide-breakout)), 0px));

  @media (max-width: 774px) {
    margin: 0 -1rem;
  }

  & img {
    max-width: var(--wide-content-width);
  }

  & .clean-image-box {
    transform: unset;
  }

  &:is(a) {
    padding-bottom: 0;
  }
}



================================================
FILE: src/lib/prose/Ol.module.css
================================================
.Ol {
  counter-reset: ol var(--start, 0);
  list-style-type: none;
  padding: 0;

  & > li {
    text-indent: -1.5em;
    padding-left: 1.5em;

    &:before {
      @apply text-gray-600;

      :global(.dark) & {
        @apply text-gray-400;
      }

      counter-increment: ol;
      content: counter(ol) ".";
      @apply italic font-serif;
      font-size: 1em;
      font-weight: 700;

      display: inline-flex;
      align-items: center;
      justify-content: flex-end;

      text-align: right;
      min-width: 0.75em;
      margin-right: 0.5em;
      user-select: none;
    }
  }

  & li {
    line-height: 1.75;
  }

  & li > p {
    display: contents;
  }

  ul &,
  ol & {
    margin-top: 0;
  }
}



================================================
FILE: src/lib/prose/Ol.tsx
================================================
import type { JSX } from "solid-js/jsx-runtime";

import styles from "./Ol.module.css";

export interface OlProps extends JSX.HTMLAttributes<HTMLOListElement> {
  style: JSX.CSSProperties;
}

export function Ol(props: OlProps) {
  return (
    <ol
      {...props}
      classList={{ ...props.classList, [styles.Ol!]: true }}
      style={{
        ...props.style,
        "--start": (props as { start?: number | string }).start || 0,
      }}
    />
  );
}



================================================
FILE: src/lib/prose/Paragraph.module.css
================================================
.Paragraph {
  @apply -m-2 max-w-prose p-2;

  line-height: 1.75;
  text-overflow: ellipsis;
  overflow-x: hidden;

  /* This is under assumption that `img` is full width image not just an icon. */
  /* I can think of a reorganization using CSS Grid that would also work on Firefox,
     but this seems sufficient for the time being. */
  &:has(img) {
    overflow-x: visible;
    padding-left: 0;
    padding-right: 0;
    margin-left: 0;
    margin-right: 0;
  }

  & a {
    white-space: nowrap;
    max-width: var(--container-width);
  }
}



================================================
FILE: src/lib/prose/Paragraph.tsx
================================================
import type { JSX } from "solid-js";

import styles from "./Paragraph.module.css";

export function Paragraph(props: JSX.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} classList={{ [styles.Paragraph!]: true }} />;
}



================================================
FILE: src/lib/prose/prose.css
================================================
:root {
  --container-width: 43rem;
  --wide-content-width: min(var(--container-width), 100vw);
}

@media (min-width: 774px) {
  :root {
    --wide-breakout: 0.2;
    --wide-content-width: min(
      100vw,
      calc(var(--container-width) * (1 + var(--wide-breakout)))
    );
  }
}

.prose {
  

  --block-mb: 1.5rem;

  @apply max-w-container;
  @apply text-[17px] md:text-[18px];

  & > :not(:last-child) {
    margin-bottom: var(--block-mb);
  }

  & em {
    @apply italic font-serif;
  }

  & strong,
  & strong > em {
    font-weight: 700;
  }

  & hr {
    @apply border-b-2 border-border;
  }

  & figcaption {
    @apply px-6 text-muted;

    @apply italic font-serif;
  }
}

/* Introduced in src/build-time/asidesPlugin.ts */
.post-aside {
  --aside-width: 20em;
  --gap: 1rem;
  --divider-width: 1px;

  display: flex;
  flex-wrap: wrap;
  width: calc(100% + var(--aside-width) + var(--gap) + var(--divider-width));
  max-width: 100vw;

  & > :first-child {
    @apply w-full max-w-container flex-shrink-0 flex-grow;
  }

  & > aside {
    @apply relative h-min flex-shrink-0 flex-grow text-sm;
    width: var(--aside-width);
    padding-left: var(--gap);

    &::before {
      content: "";
      @apply absolute -left-px h-full border-l border-border;
    }
  }

  @media (max-width: 1280px) {
    & {
      width: 100%;
    }

    & > aside {
      margin-top: var(--block-mb);

      &::before {
        /* The left border of `aside` will always be positioned inside of the
           prose container. */
        @apply left-0;
      }
    }
  }
}

details {
  @apply -mx-4 rounded-lg border border-border;

  & summary::after {
    content: "↧";
    @apply absolute -top-0.5 right-2 translate-y-[-0.5px] text-xl;
  }

  &:not([open]) {
    border-bottom-style: dashed;
  }

  &[open] summary {
    @apply mb-2;

    &::after {
      transform: rotate(-180deg) translateY(-0.1em);
    }
  }

  & > * {
    @apply !m-0 px-2;
  }

  & summary {
    cursor: pointer;
    list-style: none;

    & > p {
      @apply !m-0 !px-0;
    }

    @apply relative before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded before:bg-transparent before:transition-colors before:content-[''] hover:before:bg-surface focus:before:bg-surface selected:before:bg-surface;
  }
}



================================================
FILE: src/lib/prose/Table.module.css
================================================
.Table {
  border-collapse: collapse;
  table-layout: fixed;

  & thead {
    @apply border-b;
  }

  & th {
    text-align: left;
  }

  & th,
  & td {
    @apply px-2 py-1 md:px-4;
  }
}

:global(.dark) .Table thead {
  @apply border-gray-700;
}



================================================
FILE: src/lib/prose/Table.tsx
================================================
import type { JSX } from "solid-js";

import styles from "./Table.module.css";

export function Table(props: JSX.HTMLAttributes<HTMLTableElement>) {
  return (
    <table
      {...props}
      classList={{ ...props.classList, [styles.Table!]: true }}
    />
  );
}



================================================
FILE: src/lib/prose/Ul.module.css
================================================
.Ul {
  list-style-type: disc;
  list-style-position: outside;
  padding-left: 1em;
  margin-top: -0.5em;

  /* nested lists are the worse */
  text-indent: 0;

  &.contains-task-list {
    list-style-type: none;
    padding-left: 0;

    & > li > input[type="checkbox"] {
      transform: translateY(1px);
    }
  }

  ul &,
  ol & {
    margin-top: 0;
  }
}



================================================
FILE: src/lib/prose/Ul.tsx
================================================
import type { JSX } from "solid-js";

import styles from "./Ul.module.css";

export function Ul(props: JSX.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul {...props} classList={{ ...props.classList, [styles.Ul!]: true }} />
  );
}



================================================
FILE: src/lib/TableOfContents/HeadingsIntersectionHighlight.tsx
================================================
import type { MarkdownHeading } from "astro";
import { createEffect, onCleanup } from "solid-js";
import { isServer } from "solid-js/web";

export interface HeadingsIntersectionHighlightProps {
  headings: Pick<MarkdownHeading, "slug">[];
}

export function HeadingsIntersectionHighlight(
  props: HeadingsIntersectionHighlightProps,
) {
  const toc = !isServer && document.getElementById("table-of-contents")!;
  let current: HTMLAnchorElement | undefined;

  const highlightTocItem = (anchor: HTMLAnchorElement | null) => {
    if (!anchor) return;
    if (current) current.ariaCurrent = null;
    anchor.ariaCurrent = "true";
    current = anchor;
  };

  const observer =
    typeof globalThis.IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            entries = entries.filter((e) => e.isIntersecting);
            if (entries.length === 0) return;

            const max = entries.reduce((acc, val) =>
              val.intersectionRatio > acc.intersectionRatio ? val : acc,
            );

            if (toc) {
              highlightTocItem(
                toc.querySelector<HTMLAnchorElement>(
                  `a[href="#${max.target.id}"]`,
                ),
              );
            }
          },
          { threshold: 1, rootMargin: "-15% 0% -55% 0%" },
        )
      : null;

  createEffect(() => {
    for (const heading of props.headings) {
      const element = document.getElementById(heading.slug);
      if (element) {
        observer!.observe(element);
      }
    }

    onCleanup(() => {
      observer!.disconnect();
    });
  }, [props.headings]);

  return null;
}



================================================
FILE: src/lib/TableOfContents/PostProgressBar.tsx
================================================
import { createEffect, onCleanup } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";

/**
 * Renders vertical progress bar and highlights currently visible heading.
 */
export function PostProgressBar(props: { children: JSX.Element }) {
  let progressThumb!: HTMLDivElement;

  createEffect(() => {
    // We assume the eyes look at the middle of the screen.
    const onScroll = () => {
      const trackHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pos = window.scrollY;

      const progress = Math.min(1, Math.max(0, pos / trackHeight));

      progressThumb.style.setProperty("--y", `${100 - progress * 100}%`);
    };

    const disposeScrollListener = createScrollListener(onScroll);
    window.addEventListener("resize", onScroll, { passive: true });

    onCleanup(() => {
      disposeScrollListener();
      window.removeEventListener("resize", onScroll);
    });
  }, []);

  return (
    <div class="relative">
      <div class="absolute -left-4 h-full w-[2px] overflow-hidden rounded-sm bg-surface">
        <div
          class={
            "absolute h-full w-full rounded-sm bg-accent " +
            "-translate-y-[var(--y,100%)] transition-transform duration-300 ease-linear"
          }
          ref={progressThumb}
        />
      </div>
      {props.children}
    </div>
  );
}

function createScrollListener(callback: (scrollY: number) => void) {
  let scrollY = -1;
  let animatedKilled = false;

  const animate = () => {
    requestAnimationFrame(onScroll);
  };

  function onScroll() {
    if (animatedKilled) return;

    const newPos = window.scrollY;
    if (scrollY !== newPos) {
      window.removeEventListener("scroll", animate);
      scrollY = window.scrollY;
      callback(scrollY);
      animate();
    } else {
      window.addEventListener("scroll", animate);
    }
  }

  animate();

  return () => {
    animatedKilled = true;
    window.removeEventListener("scroll", animate);
  };
}



================================================
FILE: src/lib/TableOfContents/TableOfContents.astro
================================================
---
import type { MarkdownHeading } from "astro";

import { Link } from "../Link";

import { HeadingsIntersectionHighlight } from "./HeadingsIntersectionHighlight";
import { PostProgressBar } from "./PostProgressBar";

export interface Props {
  headings: MarkdownHeading[];
}

const { headings } = Astro.props;
const tocShown = headings.length > 2;

---

{tocShown && <section
  class="fixed left-[max(0px,calc(50%-43rem/2-20rem-1rem))] top-16 w-[calc(20rem-(var(--wide-content-width)-var(--container-width))/2)] max-h-full overflow-y-auto p-4 pr-0 hidden xl:block"
>
  <PostProgressBar client:media="(min-width: 1280px)">
    <ul
      id="table-of-contents"
      class="text-muted text-sm leading-6"
    >
      {
        headings.map(({ text, depth, slug }) => {
          if (depth < 2 || depth > 3) return null;

          return (
            <li class:list={{ "ml-4": depth === 3 }}>
              <Link
                noUnderline
                href={"#" + slug}
                class="current:text-foreground current:font-semibold"
              >
                {text}
              </Link>
            </li>
          );
        })
      }
    </ul>
  </PostProgressBar>
  <HeadingsIntersectionHighlight
    headings={headings}
    client:media="(min-width: 1280px)"
  />
  <style>
    #table-of-contents:hover {
      & a:not(:hover) {
        @apply text-muted transition-colors;
      }

      & a:hover {
        @apply text-foreground;
      }
    }
  </style>
</section>
}



================================================
FILE: src/pages/[...path].astro
================================================
---
import type { MarkdownInstance } from "astro";

import PostLayout from "../layouts/PostLayout.astro";
import { Link } from "../lib/Link";
import { Blockquote } from "../lib/prose/Blockquote";
import { Code } from "../lib/prose/code-and-pre";
import { createHeading } from "../lib/prose/Heading";
import Image from "../lib/prose/Image.astro";
import { Ol } from "../lib/prose/Ol";
import { Paragraph } from "../lib/prose/Paragraph";
import { Table } from "../lib/prose/Table";
import { Ul } from "../lib/prose/Ul";
import type { PostFrontmatter } from "../types";

export const getStaticPaths = async () => {
  let posts = await Astro.glob<PostFrontmatter>("../../posts/**/*.mdx");

  if (import.meta.env.PROD) {
    posts = posts.filter((post) => !post.frontmatter.draft);
  }

  return posts.map((post) => {
    return {
      params: {
        path: post.frontmatter.path.replace(/^\//, ""),
      },
      props: post,
    };
  });
};

interface Props extends Omit<MarkdownInstance<{}>, "frontmatter"> {
  frontmatter: PostFrontmatter;
}
const { Content } = Astro.props;

const mdxComponents = {
  a: Link,
  h1: createHeading("h1"),
  h2: createHeading("h2"),
  h3: createHeading("h3"),
  h4: createHeading("h4"),
  h5: createHeading("h5"),
  h6: createHeading("h6"),
  img: Image,
  table: Table,
  ul: Ul,
  ol: Ol,
  blockquote: Blockquote,
  code: Code,
  Code,
  // Note: 'pre' is not overridden so Astro's built-in Shiki can handle code blocks
  // Take note that `mdxComponents` replace only Markdown and uppercased components,
  // not inline lowercased JSX, so using `<p>` in and .mdx file won't use the `Paragraph`.
  p: Paragraph,
};
---

<PostLayout {...Astro.props} headings={Astro.props.getHeadings()}>
  <Content components={mdxComponents} />
</PostLayout>



================================================
FILE: src/pages/index.astro
================================================
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { Link } from "../lib/Link";
import { Paragraph } from "../lib/prose/Paragraph";
import type { PostFrontmatter } from "../types";

let posts = await Astro.glob<PostFrontmatter>("../../posts/**/*.mdx");

if (import.meta.env.PROD) {
  posts = posts.filter((post) => !post.frontmatter.draft);
}

posts.sort((a, b) => {
  return (
    new Date(b.frontmatter.date).getTime() -
    new Date(a.frontmatter.date).getTime()
  );
});
---

<BaseLayout
  title="keaton elvins"
  description="the garden in question"
>
  <h1 slot="header-content" class="text-muted">keaton elvins</h1>
  <main class="prose py-10">
    <Paragraph>
      <small class="text-muted">
        "It is only through the confining act of writing that the immensity of the nonwritten becomes legible"<br />
        <span>&mdash; Italo Calvino, <i>If on a Winter's Night a Traveler</i></span>
      </small>
      <br />
    </Paragraph>
    <Paragraph class="mt-6">
      There are many reasons to write. 
      <Link href="https://paulgraham.com/words.html">Paul Graham</Link> and <Link href="https://gwern.net/about#the-content">Gwern</Link> have theirs.
    </Paragraph>
    <Paragraph class="mt-6">
      I just want to understand, is all.
    </Paragraph>
  </main>
  <ul>
    {
      posts.map(({ frontmatter }) => {
        return (
          <li>
            <Link
              href={frontmatter.path}
              class="flex flex-row justify-between gap-2"
              noUnderline
            >
              <h2 class="font-sans font-medium text-3xl md:text-5xl leading-tight md:leading-tight">
                {frontmatter.title}
              </h2>
            </Link>
          </li>
        );
      })
    }
  </ul>
</BaseLayout>



================================================
FILE: src/types/index.ts
================================================
import type { MarkdownHeading, MarkdownLayoutProps } from "astro";

export interface PostFrontmatter {
  tags: string[];
  /**
   * Optional description for the post, visible in Open Graph cards.
   */
  description?: string;
  /**
   * Optional URL to a picture or a dict of URLs to pictures.
   * */
  img?:
    | string
    | {
        /** Image for the Open Graph social card. */
        og?: string;
        /** Image for the post header.` */
        src?: string;
      };
  /**
   * @computed by derivedTitleAndDatePlugin from file name
   *           if not given
   */
  title: string;
  /**
   * Required date for the post (should be in frontmatter)
   */
  date: string;
  /**
   * @computed by defaultLayoutPlugin
   */
  layout?: string;
  /**
   * @computed by urlOutsideOfPagesDirPlugin
   */
  path: string;
  draft?: boolean;
}

interface BasePostProps {
  file: string;
  frontmatter: PostFrontmatter;
  url?: undefined;
  path: string;
}

/** @see https://docs.astro.build/en/guides/markdown-content/#markdown-layout-props */
type MarkdownPostProps = Omit<MarkdownLayoutProps<{}>, "frontmatter">;

/** @see https://docs.astro.build/en/guides/integrations-guide/mdx/#exported-properties */
type MDXPostProps = {
  getHeadings: () => MarkdownHeading[];
};

export type PostProps = BasePostProps & (MarkdownPostProps | MDXPostProps);


