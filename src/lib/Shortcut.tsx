import type { JSX } from "solid-js";
import { For } from "solid-js";


export interface ShortcutProps extends JSX.HTMLAttributes<HTMLElement> {
  shortcut: string;
}

export function Shortcut(props: ShortcutProps) {
  // This component cannot be used on serverside;
  const IS_MAC = typeof window !== "undefined" && /mac/i.test(navigator.userAgent);

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
              class="rounded-md border border-b-2 p-1 text-xs leading-none tracking-tighter border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]"
            >
              {key}
            </kbd>
          );
        }}
      </For>
    </span>
  );
}
