import type {Metadata} from 'next';
import './globals.css';
import { AppProvider } from '@/components/app/AppContext';
import { Toaster } from "@/components/ui/toaster"
import AudioPlayer from '@/components/app/shared/AudioPlayer';
import BroadcastViewer from '@/components/app/shared/BroadcastViewer';

export const metadata: Metadata = {
  title: "Soto's Foods",
  description: '¡Tan diferentes Como Tú!',
  icons: {
    icon: 'https://i.ibb.co/1YDd8bvR/Sotos-Fast-Food-Drinks.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poetsen+One&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppProvider>
          {children}
          <Toaster />
          <AudioPlayer />
          <BroadcastViewer />
        </AppProvider>
      </body>
    </html>
  );
}
