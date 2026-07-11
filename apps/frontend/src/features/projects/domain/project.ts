/** A knowledge space of an organization ("space" in the backend). */
export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  docCount: number;
  updatedAt: string;
}
