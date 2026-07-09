export type ChatMode =
  | 'general'
  | 'explain-process'
  | 'design-requirement'
  | 'summary'
  | 'explain-rules'
  | 'detect-contradictions'
  | 'acceptance-criteria';

export interface ChatModeOption {
  value: ChatMode;
  label: string;
  description: string;
}

export const CHAT_MODES: ChatModeOption[] = [
  { value: 'general', label: 'Consulta general', description: 'Preguntas libres sobre la documentación del proyecto.' },
  { value: 'explain-process', label: 'Explicar proceso', description: 'Describe paso a paso cómo funciona un proceso.' },
  { value: 'design-requirement', label: 'Diseñar requerimiento', description: 'Ayuda a redactar un requerimiento nuevo.' },
  { value: 'summary', label: 'Resumen', description: 'Resume documentos o secciones extensas.' },
  { value: 'explain-rules', label: 'Explicar reglas', description: 'Detalla reglas de negocio documentadas.' },
  { value: 'detect-contradictions', label: 'Detectar contradicciones', description: 'Busca inconsistencias entre documentos.' },
  { value: 'acceptance-criteria', label: 'Criterios de aceptación', description: 'Genera criterios de aceptación para una historia.' },
];
