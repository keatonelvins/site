import { type JSX, splitProps } from "solid-js";

export interface LinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  noUnderline?: boolean;
}

export function Link(props: LinkProps) {
  const [own, rest] = splitProps(props, ["classList", "noUnderline"]);

  return (
    <a
      classList={{
        ...own.classList,
        "underline underline-offset-4 decoration-gray-300 dark:decoration-gray-600 hover:decoration-transparent dark:hover:decoration-transparent focus:decoration-transparent dark:focus:decoration-transparent": !own.noUnderline,
        "transition-colors": true,
      }}
      {...rest}
    />
  );
}
