import {
  createEffect,
  createSignal,
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
  CommandInput,
  CommandItem as CommandCenterItem,
  type CommandItemProps as CommandCenterItemProps,
  CommandList,
  useCommandCenterCtx,
} from "./CommandCenter";
import { DialogCloseButton } from "./Dialog";
import { Shortcut } from "./Shortcut";

function parseKeys(event: KeyboardEvent) {
  const code = event.code.replace(/^Key|^Digit/, "").toLowerCase();
  const key = event.key.toLowerCase();
  return { code, key };
}

const INPUT_ID = "command-input";

export function Commands({
  posts,
}: {
  posts: { title: string; href: string }[];
}) {
  const [clientside, setClientside] = createSignal(false);
  onMount(() => setClientside(true));

  return (
    <CommandCenter inputId={INPUT_ID}>
      <CommandCenterTrigger
        class="hover:underline"
        style={{ color: "var(--color-muted)" }}
      />
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
  const { getInputValue, onInput } = useCommandCenterCtx();

  const [page, setPage] = createSignal<CommandsPage>();
  let dialog: HTMLDialogElement | undefined;

  createEffect(() => {
    const currentPage = page();
    if (currentPage) {
      onInput("");
      const input = document.getElementById(INPUT_ID) as HTMLInputElement;
      if (input) input.value = "";
    }
  });

  const setColorScheme = (scheme: ColorScheme) => {
    if (page() !== "theme") return;
    setScheme(scheme);
    dialog?.close();
  };

  const getSelected = () =>
    dialog?.querySelector('[aria-selected="true"]') as HTMLElement | null;

  const IS_MAC = typeof window !== "undefined" &&
    /mac/i.test(navigator.userAgent);

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
      const cmdKey = IS_MAC ? event.metaKey : event.ctrlKey;
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
      class="relative mx-auto w-96 max-w-full transform flex-col overflow-hidden rounded-xl p-0 shadow-2xl ring-1 transition-all [&[open]]:flex bg-[var(--color-surface)]"
      style={{
        "--tw-ring-color": "color-mix(in oklch, var(--color-foreground) 20%, transparent)",
      } as any}
    >
      <div class="flex justify-end">
        <DialogCloseButton class="group cursor-pointer p-2 focus:outline-none">
          <kbd
            aria-hidden
            class="rounded-md border border-b-2 p-1 text-xs leading-none tracking-tighter border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]"
          >
            esc
          </kbd>
          <span class="sr-only">Close</span>
        </DialogCloseButton>
      </div>
      <CommandInput
        aria-label="Commands"
        class="relative w-full bg-transparent p-2 indent-2 focus:outline-none text-[var(--color-foreground)]"
        placeholder="what is it that you are looking for?"
        autofocus
      />
      <div class="mx-2 border-b border-[var(--color-border)]" />
      <CommandList class="overflow-scroll p-2">
        <Switch
          fallback={
            <>
              <CommandItem shortcut="alt+t" onClick={handleShortcut}>
                theme
              </CommandItem>
              <CommandItem shortcut="alt+slash" onClick={handleShortcut}>
                search posts
              </CommandItem>
              <CommandItem href="/bookshelf">bookshelf</CommandItem>
              <CommandItem href="https://sites.google.com/view/myfuji/">ephemera</CommandItem>
            </>
          }
        >
          <Match when={page() === "theme"}>
            <CommandItem shortcut="1" onClick={handleShortcut}>
              light theme
            </CommandItem>
            <CommandItem shortcut="2" onClick={handleShortcut}>
              dark theme
            </CommandItem>
            <CommandItem shortcut="3" onClick={handleShortcut}>
              system theme
            </CommandItem>
          </Match>
          <Match when={page() === "posts"}>
            {posts.map((p) => (
              <CommandItem href={p.href}>{p.title}</CommandItem>
            ))}
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
      <span class="hover:underline" data-command-text="">
        {own.children}
      </span>
      <Show when={own.shortcut} keyed>
        {(shortcut) => <Shortcut class="ml-1" shortcut={shortcut} />}
      </Show>
    </>
  );

  return (
    <CommandCenterItem
      class="relative flex w-full cursor-pointer justify-between p-2 focus-visible:outline-black text-[var(--color-foreground)] selected:bg-[var(--color-surface)] selected:[&>span:first-child]:underline"
      tabIndex={-1}
      onClick={() => {
        if (own.shortcut) own.onClick!(own.shortcut);
      }}
      {...rest}
    >
      {content}
    </CommandCenterItem>
  );
}

function plus(...xs: (string | boolean | undefined | null)[]) {
  return xs.filter(Boolean).join("+");
}
