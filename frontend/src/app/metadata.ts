import { Metadata } from 'next';

const defaultKeywords = [
  'open source',
  'developer tools',
  'project collaboration',
  'tech community',
  'software development',
  'code repository',
  'developer resources',
  'programming tools',
  'tech projects',
  'developer platform',
  'open source projects',
  'coding community',
  'software tools',
  'development resources',
  'tech innovation',
  'collaborative development',
  'project management',
  'developer network',
  'code sharing',
  'tech ecosystem'
];

export const defaultMetadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://zemon.dev'),
  title: {
    default: 'Zemon - Open Source Developer Community & Tools Platform',
    template: '%s | Zemon'
  },
  description: 'Discover and collaborate on open source projects, find developer tools, and connect with a global tech community. Join India\'s premier platform for developers and innovators.',
  keywords: defaultKeywords,
  authors: [{ name: 'Zemon Team' }],
  creator: 'Zemon',
  publisher: 'Zemon',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://zemon.dev',
    title: 'Zemon - Open Source Developer Community & Tools Platform',
    description: 'Discover and collaborate on open source projects, find developer tools, and connect with a global tech community. Join India\'s premier platform for developers and innovators.',
    siteName: 'Zemon',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Zemon - Open Source Developer Community'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zemon - Open Source Developer Community & Tools Platform',
    description: 'Discover and collaborate on open source projects, find developer tools, and connect with a global tech community.',
    images: ['/og-image.jpg'],
    creator: '@zemon_dev'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png',
    },
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://zemon.dev',
    languages: {
      'en-US': 'https://zemon.dev',
    },
  },
  verification: {
    google: 'your-google-site-verification',
    yandex: 'your-yandex-verification',
  },
}; 