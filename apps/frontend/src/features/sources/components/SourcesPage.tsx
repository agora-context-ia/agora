import { ArrowLeft, FolderOpen } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useActiveOrganizationId } from '@/features/organizations/application/use-active-organization';
import { useOrganizationList } from '@/features/organizations/application/use-organization-list';
import { useProjectList } from '@/features/projects/application/use-project-list';
import { useSources } from '../application/use-sources';
import { SourceList } from './SourceList';
import { SourceUploadZone } from './SourceUploadZone';

/** Full page listing and managing the documents of a project. */
export function SourcesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  // Called here too (not only in the shell) because this URL can be
  // opened directly without visiting "/": they load the orgs (setting
  // the active one) and that organization's projects.
  useOrganizationList();
  const activeOrganizationId = useActiveOrganizationId();
  const { projects } = useProjectList();
  const project = projects.find((item) => item.id === projectId);
  const { sources, isLoading } = useSources(activeOrganizationId, projectId ?? null);

  if (!projectId) return null;

  return (
    <div className="flex h-screen w-screen flex-col overflow-y-auto bg-background text-foreground">
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-sm font-semibold">{project?.name ?? 'Proyecto'}</h1>
          <p className="text-xs text-muted-foreground">Fuentes del proyecto</p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-6">
        {activeOrganizationId && (
          <SourceUploadZone organizationId={activeOrganizationId} projectId={projectId} />
        )}

        {!isLoading && sources.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Todavía no hay fuentes en este proyecto</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Subí el primer documento para que ContextHub AI pueda responder preguntas sobre él.
              </p>
            </div>
          </div>
        ) : (
          activeOrganizationId && (
            <SourceList
              organizationId={activeOrganizationId}
              projectId={projectId}
              sources={sources}
            />
          )
        )}
      </div>
    </div>
  );
}
