import { useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageSource } from '../domain/message';

interface SourcesFootnoteProps {
  sources: MessageSource[];
}

/** Collapsible list of the documents that grounded a reply. */
export function SourcesFootnote({ sources }: SourcesFootnoteProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2 border-t border-border/70 pt-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
        {sources.length} {sources.length === 1 ? 'fuente' : 'fuentes'}
      </button>

      {isOpen && (
        <ul className="mt-2 flex flex-col gap-2">
          {sources.map((source, index) => (
            <li key={`${source.documentName}-${index}`} className="flex gap-2 rounded-md bg-muted/60 p-2">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{source.documentName}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{source.fragment}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
