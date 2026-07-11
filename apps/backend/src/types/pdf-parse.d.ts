// The deep import avoids the debug block in pdf-parse v1's index; the
// types are the same ones @types/pdf-parse exposes for the root module.
declare module 'pdf-parse/lib/pdf-parse.js' {
  import pdfParse from 'pdf-parse';
  export default pdfParse;
}
