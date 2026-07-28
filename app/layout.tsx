import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSA Command Center",
  description: "A focused, cross-device DSA practice operating system.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
