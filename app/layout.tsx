import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loops",
  description: "A personal command center for threads of intent.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const stored = window.localStorage.getItem("loops-theme");
                  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const theme = stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";
                  document.documentElement.dataset.theme = theme;
                } catch {
                  document.documentElement.dataset.theme = "light";
                }
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
