import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, ExternalLink, SearchX } from 'lucide-react';
import type { ActiveJob } from '@/hooks/useChat';

interface JobNotificationCardProps {
  job: ActiveJob;
}

export const JobNotificationCard = ({ job }: JobNotificationCardProps) => {
  const { status, result, error } = job;

  const permitType = result?.permitType || 'permit';
  const city = result?.city || '';

  return (
    <div className="flex gap-3 max-w-[90%] mr-auto">
      <div className="w-8 shrink-0" />
      <Card className="max-w-lg border-border/50 overflow-hidden w-full">
        <CardContent className="p-4">
          {status === 'started' && (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Permit Search In Progress</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Searching for {permitType} permits{city ? ` in ${city}` : ''}...
                </p>
              </div>
              <Badge variant="default" className="bg-blue-500 hover:bg-blue-500/80 text-[10px] shrink-0">
                Running
              </Badge>
            </div>
          )}

          {status === 'completed' && (result?.total ?? 0) === 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <SearchX className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">No Permits Found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No {permitType} contractors found{city ? ` in ${city}` : ''}
                  </p>
                </div>
                <Badge variant="default" className="bg-amber-500 hover:bg-amber-500/80 text-[10px] shrink-0">
                  No Results
                </Badge>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1.5">Try adjusting your search:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Search a nearby or larger city</li>
                  <li>• Try a different permit type (HVAC, electrical, roofing, etc.)</li>
                  <li>• Widen the date range</li>
                </ul>
              </div>
            </div>
          )}

          {status === 'completed' && (result?.total ?? 0) > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Permit Search Complete</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Found {result?.total?.toLocaleString() ?? 0} {permitType} contractors{city ? ` in ${city}` : ''}
                  </p>
                </div>
                <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-500/80 text-[10px] shrink-0">
                  Done
                </Badge>
              </div>

              {result && (
                <div className="space-y-3">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded-lg px-2 py-1.5">
                      <p className="text-sm font-semibold">{result.total?.toLocaleString() ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg px-2 py-1.5">
                      <p className="text-sm font-semibold text-emerald-600">{result.enriched?.toLocaleString() ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Enriched</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg px-2 py-1.5">
                      <p className="text-sm font-semibold text-amber-600">{result.incomplete?.toLocaleString() ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Incomplete</p>
                    </div>
                  </div>

                  {/* Contacts table */}
                  {result.contacts && result.contacts.length > 0 && (
                    <div className="border border-border/50 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border/50">
                            <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">Name</th>
                            <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">Company</th>
                            <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">Email</th>
                            <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.contacts.map((contact, i) => (
                            <tr key={i} className="border-b border-border/30 last:border-0">
                              <td className="px-2.5 py-1.5 font-medium truncate max-w-[120px]">{contact.name}</td>
                              <td className="px-2.5 py-1.5 text-muted-foreground truncate max-w-[100px]">{contact.company}</td>
                              <td className="px-2.5 py-1.5 text-muted-foreground truncate max-w-[140px]">{contact.email || '—'}</td>
                              <td className="px-2.5 py-1.5 text-muted-foreground truncate max-w-[100px]">{contact.phone || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(result.total ?? 0) > result.contacts.length && (
                        <div className="px-2.5 py-1.5 bg-muted/30 text-[10px] text-muted-foreground text-center">
                          Showing {result.contacts.length} of {result.total?.toLocaleString()} results
                        </div>
                      )}
                    </div>
                  )}

                  {result.sheetUrl && (
                    <a
                      href={result.sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Google Sheet
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {status === 'failed' && (
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Permit Search Failed</p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  {error || 'An unexpected error occurred'}
                </p>
              </div>
              <Badge variant="destructive" className="text-[10px] shrink-0">
                Failed
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
