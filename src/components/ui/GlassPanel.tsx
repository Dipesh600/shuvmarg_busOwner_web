import { cn } from "@/lib/utils";
import { ReactNode, ElementType, HTMLAttributes } from "react";

interface GlassPanelProps<T extends ElementType = "div"> {
  as?: T;
  children: ReactNode;
  className?: string;
  noHover?: boolean;
  style?: HTMLAttributes<HTMLElement>["style"];
}

export default function GlassPanel<T extends ElementType = "div">({
  as,
  children,
  className,
  noHover = false,
  style,
  ...rest
}: GlassPanelProps<T> &
  Omit<
    React.ComponentPropsWithoutRef<T>,
    keyof GlassPanelProps<T>
  >) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cn("glass-panel", noHover && "!transform-none", className)}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
