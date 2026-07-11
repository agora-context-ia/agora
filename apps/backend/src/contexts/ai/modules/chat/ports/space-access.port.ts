/**
 * Chat-owned view of space ownership, used to verify that the requested
 * space belongs to the caller's organization (multi-tenant isolation).
 */
export interface SpaceAccessPort {
  /** Returns the owning organization id, or null when the space does not exist. */
  findSpaceOrganization(spaceId: string): Promise<string | null>;
}
