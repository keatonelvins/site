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
