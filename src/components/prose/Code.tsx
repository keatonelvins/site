import type { JSX } from "solid-js";

import styles from "./Code.module.css";

export function Code(props: JSX.HTMLAttributes<HTMLElement>) {
  return (
    <code {...props} classList={{ ...props.classList, [styles.Code!]: true }} />
  );
}
