import type { Project } from '../domain/project';

export interface CreateProjectInput {
  organizationId: string;
  name: string;
  description: string;
}

export interface ProjectApiPort {
  list(organizationId: string): Promise<Project[]>;
  create(input: CreateProjectInput): Promise<Project>;
}
