import type { Project } from '../domain/project';

export interface CreateProjectInput {
  name: string;
  description: string;
}

export interface ProjectApiPort {
  list(): Promise<Project[]>;
  create(input: CreateProjectInput): Promise<Project>;
}
