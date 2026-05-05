import type { Metadata } from "next";
import { Inter, Epilogue } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Walk-Way — городской гид по вайбу",
    template: "%s | Walk-Way",
  },
  description:
    "Находите кафе, парки, арт-пространства и улицы по вайбу, времени и настроению. Более 2 000 мест в Москве.",
  keywords: ["москва", "места", "прогулки", "кафе", "парки", "маршруты"],
  openGraph: {
    title: "Walk-Way",
    description: "Городской гид по вайбу",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${epilogue.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
