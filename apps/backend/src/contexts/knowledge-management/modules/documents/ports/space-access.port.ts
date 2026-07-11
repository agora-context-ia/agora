/**
 * Document use cases validate that the space belongs to the URL's
 * organization before touching anything (404 otherwise).
 */
export interface SpaceAccessPort {
  /** Returns the owning organization id, or null when the space does not exist. */
  findSpaceOrganization(spaceId: string): Promise<string | null>;
}
