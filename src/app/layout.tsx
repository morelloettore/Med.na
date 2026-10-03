import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Med.na - Gestão e Agendamento Clínico",
  description: "Sistema de gerenciamento hospitalar, consultas virtuais e presenciais Med.na",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
