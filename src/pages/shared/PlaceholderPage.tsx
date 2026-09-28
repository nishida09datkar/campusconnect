import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Construction } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description: string;
  targetPhase: string;
}

export const PlaceholderPage: React.FC<PlaceholderProps> = ({ title, description, targetPhase }) => {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: title },
        ]}
      />
      <Card className="border-dashed border-2">
        <CardContent className="py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-600 mx-auto flex items-center justify-center">
            <Construction className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">{title} Ready for Implementation</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              This module is scheduled for implementation in <strong>{targetPhase}</strong> according to the phased roadmap.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
