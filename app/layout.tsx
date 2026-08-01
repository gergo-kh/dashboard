import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KonverzióHuszár Ügyfélportál",
  description: "Client reporting portal foundation for KonverzióHuszár."
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  );
}
