// El import profundo evita el bloque de debug del index de pdf-parse v1;
// los tipos son los mismos que expone @types/pdf-parse para el módulo raíz.
declare module 'pdf-parse/lib/pdf-parse.js' {
  import pdfParse from 'pdf-parse';
  export default pdfParse;
}
