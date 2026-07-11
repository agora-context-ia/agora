import type { Project } from '../domain/project';

/** Payload to create a project. */
export interface CreateProjectInput {
  organizationId: string;
  name: string;
  description: string;
}

/** API client contract for the projects feature. */
export interface ProjectApiPort {
  list(organizationId: string): Promise<Project[]>;
  create(input: CreateProjectInput): Promise<Project>;
}
