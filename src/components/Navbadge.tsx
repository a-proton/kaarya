/**
 * NavBadge — icon button with unread count badge
 * Location: components/NavBadge.tsx
 *
 * Usage in provider navbar:
 *   <NavBadge icon={faBell}    count={unreadNotifications} href="/provider/notifications" />
 *   <NavBadge icon={faEnvelope} count={unreadMessages}     href="/provider/messages" />
 *
 * Usage in client navbar:
 *   <NavBadge icon={faBell}    count={unreadNotifications} href="/client/notifications" />
 *   <NavBadge icon={faEnvelope} count={unreadMessages}     href="/client/messages" />
 */

"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Link from "next/link";

interface NavBadgeProps {
  icon: IconDefinition;
  count: number;
  href: string;
  label?: string; // screen-reader label
  maxCount?: number; // cap display at this number, default 99
}

export function NavBadge({
  icon,
  count,
  href,
  label = "Notifications",
  maxCount = 99,
}: NavBadgeProps) {
  const display = count > maxCount ? `${maxCount}+` : String(count);
  const hasCount = count > 0;

  return (
    <Link
      href={href}
      aria-label={`${label}${hasCount ? `, ${count} unread` : ""}`}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "2.25rem",
        height: "2.25rem",
        borderRadius: "0.625rem",
        color: "var(--color-neutral-600)",
        textDecoration: "none",
        transition: "background-color 150ms, color 150ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
          "var(--color-neutral-100)";
        (e.currentTarget as HTMLAnchorElement).style.color =
          "var(--color-neutral-900)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
          "transparent";
        (e.currentTarget as HTMLAnchorElement).style.color =
          "var(--color-neutral-600)";
      }}
    >
      <FontAwesomeIcon icon={icon} style={{ fontSize: "1rem" }} />

      {hasCount && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: count > 9 ? "-0.35rem" : "-0.25rem",
            right: count > 9 ? "-0.35rem" : "-0.2rem",
            minWidth: count > 9 ? "1.15rem" : "0.95rem",
            height: count > 9 ? "1.15rem" : "0.95rem",
            padding: "0 0.22rem",
            borderRadius: "9999px",
            backgroundColor: "#1ab189",
            color: "white",
            fontSize: count > 99 ? "0.48rem" : "0.55rem",
            fontWeight: 700,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--color-neutral-0)",
            letterSpacing: "-0.01em",
            // Subtle pop-in animation when count changes
            animation: "badge-pop 200ms ease-out",
          }}
        >
          {display}
        </span>
      )}

      <style>{`
        @keyframes badge-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </Link>
  );
}
