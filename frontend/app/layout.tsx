import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lego Agent",
  description: "Control your Lego Mindstorms EV3 robot with a web interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen">
        {children}
      </body>
    </html>
  );
}
