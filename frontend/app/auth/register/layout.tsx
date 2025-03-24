import { RegistrationProvider } from "@/contexts/RegistrationContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RegistrationProvider>
      {children}
    </RegistrationProvider>
  );
}
