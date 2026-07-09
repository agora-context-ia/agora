import type { Conversation } from '@/features/chat/domain/conversation';

export const mockConversations: Record<string, Conversation> = {
  'proj-1': {
    id: 'conv-1',
    projectId: 'proj-1',
    title: 'Consulta sobre facturación electrónica',
    messages: [
      {
        id: 'proj-1-m1',
        role: 'user',
        content: '¿Cómo se genera una nota de crédito asociada a una factura?',
        createdAt: '2026-07-06T09:58:00.000Z',
      },
      {
        id: 'proj-1-m2',
        role: 'assistant',
        content:
          'Para generar una nota de crédito debés partir siempre de la factura original: el sistema requiere el folio de esa factura y valida que el monto de la nota no supere el saldo pendiente. Una vez emitida, queda enlazada automáticamente al historial del cliente.',
        sources: [
          {
            documentName: 'Manual-Facturacion-v3.pdf',
            fragment:
              'La nota de crédito debe referenciar el folio de la factura original y no puede superar el monto facturado inicialmente.',
            relevance: 0.92,
          },
        ],
        createdAt: '2026-07-06T09:58:04.000Z',
      },
      {
        id: 'proj-1-m3',
        role: 'user',
        content: '¿Y si el cliente ya pagó la factura original?',
        createdAt: '2026-07-06T10:00:10.000Z',
      },
      {
        id: 'proj-1-m4',
        role: 'assistant',
        content:
          'Si ya existe un pago confirmado, la nota de crédito se emite igual, pero el sistema genera automáticamente un saldo a favor del cliente en lugar de ajustar una deuda pendiente. Ese saldo puede aplicarse a facturas futuras o devolverse según la política de devoluciones.',
        sources: [
          {
            documentName: 'Politicas-Devoluciones.docx',
            fragment:
              'Cuando existe un pago previo confirmado, el sistema genera un saldo a favor en lugar de descontar de una deuda existente.',
            relevance: 0.81,
          },
        ],
        createdAt: '2026-07-06T10:00:15.000Z',
      },
    ],
  },
  'proj-2': {
    id: 'conv-2',
    projectId: 'proj-2',
    title: 'Reglas de asignación de leads',
    messages: [
      {
        id: 'proj-2-m1',
        role: 'user',
        content: '¿Cómo se asignan los leads nuevos a los vendedores?',
        createdAt: '2026-07-08T08:30:00.000Z',
      },
      {
        id: 'proj-2-m2',
        role: 'assistant',
        content:
          'La asignación sigue un esquema round-robin ponderado: cada lead nuevo se ofrece al vendedor con menor carga activa dentro de su equipo. Si dos vendedores empatan en carga, se prioriza al que lleva más tiempo sin recibir un lead.',
        sources: [
          {
            documentName: 'CRM-Reglas-Negocio.md',
            fragment:
              'Los leads se asignan de forma rotativa considerando la carga actual de cada vendedor dentro del equipo correspondiente.',
            relevance: 0.88,
          },
        ],
        createdAt: '2026-07-08T08:30:06.000Z',
      },
    ],
  },
};
