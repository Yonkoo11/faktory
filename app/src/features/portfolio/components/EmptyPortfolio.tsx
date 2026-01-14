import { FileText } from 'lucide-react';

export function EmptyPortfolio() {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
        <FileText className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-lg font-medium mb-1">No invoices yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Tokenize your first invoice to start earning yield!
      </p>
      <a
        href="/dashboard/mint"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-medium hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Mint Your First Invoice
      </a>
    </div>
  );
}
