import { Bell, ShieldCheck } from "lucide-react";

import { PageTransition } from "@/components/vin-music/page-transition";
import { SectionHeading } from "@/components/vin-music/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <SectionHeading
          title="Settings"
          subtitle="Personalize notifications and workspace defaults for Vin Music."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="size-4" />
                Notification rules
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Configure notifications for newly surfaced sounds and playlist
              updates.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4" />
                Privacy controls
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Manage data visibility and define who can access your saved
              curation library.
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
