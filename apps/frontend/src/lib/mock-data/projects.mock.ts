import type { Project } from '@/features/projects/domain/project';

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Sistema de Facturación',
    description: 'Documentación funcional y técnica del módulo de facturación electrónica.',
    docCount: 12,
    updatedAt: '2026-07-06T10:00:00.000Z',
  },
  {
    id: 'proj-2',
    name: 'CRM Interno',
    description: 'Base de conocimiento del CRM usado por el equipo comercial.',
    docCount: 7,
    updatedAt: '2026-07-08T09:00:00.000Z',
  },
  {
    id: 'proj-3',
    name: 'Recursos Humanos',
    description: 'Políticas, procesos y manuales de onboarding de RRHH.',
    docCount: 3,
    updatedAt: '2026-07-01T12:00:00.000Z',
  },
];
