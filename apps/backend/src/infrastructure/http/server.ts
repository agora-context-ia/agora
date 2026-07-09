import { env } from '../config/env';

export function startServer() {
  console.log(`Server ready to start on port ${env.PORT}`);
}
