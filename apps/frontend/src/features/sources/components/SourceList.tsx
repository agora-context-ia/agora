import type { Source } from '../domain/source';
import { SourceListItem } from './SourceListItem';

interface SourceListProps {
  organizationId: string;
  projectId: string;
  sources: Source[];
}

export function SourceList({ organizationId, projectId, sources }: SourceListProps) {
  return (
    <div className="flex flex-col gap-2">
      {sources.map((source) => (
        <SourceListItem
          key={source.id}
          organizationId={organizationId}
          projectId={projectId}
          source={source}
        />
      ))}
    </div>
  );
}
