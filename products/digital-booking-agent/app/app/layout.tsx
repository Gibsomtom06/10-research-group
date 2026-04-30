import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Digital Booking Agent",
  description: "DBA — autonomous booking agent for the 10 Research Group roster",
};

const nav = [
  { href: "/dashboard", label: "dashboard" },
  { href: "/drafts", label: "drafts" },
  { href: "/history", label: "history" },
  { href: "/offers", label: "offers" },
  { href: "/outreach", label: "outreach" },
  { href: "/outreach/priorities", label: "priorities" },
  { href: "/reminders", label: "reminders" },
  { href: "/contacts", label: "contacts" },
  { href: "/markets", label: "markets" },
  { href: "/reports", label: "reports" },
  { href: "/dashboard/costs", label: "costs" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-ink font-mono min-h-screen">
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="text-accent tracking-tight">dba.</div>
          <nav className="flex gap-6 text-sm text-muted">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-ink">{n.label}</Link>
            ))}
          </nav>
        </header>
        <main className="p-6 max-w-6xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
