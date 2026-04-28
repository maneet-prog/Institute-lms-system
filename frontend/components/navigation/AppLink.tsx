"use client";

import Link, { LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnchorHTMLAttributes, MouseEvent } from "react";

import { useUiStore } from "@/store/ui";

type Props = LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>;

export function AppLink({ onClick, href, ...props }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const startNavigation = useUiStore((state) => state.startNavigation);
  const stopNavigation = useUiStore((state) => state.stopNavigation);

  const hrefPath =
    typeof href === "string"
      ? href.startsWith("http")
        ? new URL(href).pathname
        : href.split("?")[0]
      : null;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      props.target === "_blank" ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    if (hrefPath && hrefPath === pathname) {
      event.preventDefault();
      stopNavigation();
      return;
    }
    startNavigation();
  };

  return (
    <Link
      href={href}
      {...props}
      onClick={handleClick}
      onMouseEnter={(event) => {
        props.onMouseEnter?.(event);
        if (typeof href === "string" && hrefPath !== pathname) {
          router.prefetch(href);
        }
      }}
    />
  );
}
