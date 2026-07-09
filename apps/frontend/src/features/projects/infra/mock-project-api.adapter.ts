import { mockProjects } from '@/lib/mock-data/projects.mock';
import type { Project } from '../domain/project';
import type { CreateProjectInput, ProjectApiPort } from '../ports/project-api.port';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const projects: Project[] = [...mockProjects];

class MockProjectApiAdapter implements ProjectApiPort {
  async list(): Promise<Project[]> {
    await delay(400);
    return [...projects];
  }

  async create(input: CreateProjectInput): Promise<Project> {
    await delay(500);
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: input.name,
      description: input.description,
      docCount: 0,
      updatedAt: new Date().toISOString(),
    };
    projects.unshift(project);
    return project;
  }
}

export const mockProjectApiAdapter = new MockProjectApiAdapter();
