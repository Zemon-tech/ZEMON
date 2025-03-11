"use client";

import { InstallPWA } from "@/components/layout/InstallPWA";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chrome, Smartphone, Download, Apple, Globe } from "lucide-react";

export default function DownloadPage() {
  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Download Zemon</h1>
          <p className="text-lg text-muted-foreground">
            Install Zemon on your device for a better experience
          </p>
        </div>

        <div className="grid gap-8">
          {/* Install Button */}
          <Card className="p-6 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Install Zemon App</h2>
              <p className="text-muted-foreground mb-6">
                Click the button below to install Zemon on your device
              </p>
              <InstallPWA />
            </div>
          </Card>

          {/* Installation Instructions */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Desktop Instructions */}
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Chrome className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Desktop Browser</h3>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Click the install icon in your browser&apos;s address bar</li>
                <li>Select &quot;Install&quot; from the prompt</li>
                <li>Access Zemon from your desktop like any other app</li>
              </ol>
            </Card>

            {/* Mobile Instructions */}
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Mobile Device</h3>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Open Zemon in your mobile browser</li>
                <li>Tap the menu icon (⋮ or ⋯)</li>
                <li>Select &quot;Add to Home Screen&quot;</li>
                <li>Tap &quot;Add&quot; to install</li>
              </ol>
            </Card>
          </div>

          {/* Alternative Access */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Access Anywhere</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              You can always access Zemon directly through your web browser at any time.
            </p>
            <Button variant="outline" size="lg" className="w-full" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer">
                Open in Browser
              </a>
            </Button>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
} 