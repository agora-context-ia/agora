// Los use-cases de documentos validan que el espacio pertenezca a la
// organización de la URL antes de tocar nada (404 si no).
export interface SpaceAccessPort {
  /** Devuelve el organizationId dueño del espacio, o null si no existe. */
  findSpaceOrganization(spaceId: string): Promise<string | null>;
}
