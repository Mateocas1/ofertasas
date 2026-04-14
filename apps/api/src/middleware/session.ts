import type { FastifyInstance, FastifyRequest } from "fastify";

// Extend FastifyRequest to include sessionId
declare module "fastify" {
  interface FastifyRequest {
    sessionId: string;
  }
}

/**
 * Session plugin for Fastify.
 * Extracts sessionId from `x-session-id` header.
 * If missing, generates a UUID v4 and sets it on the response.
 */
export async function sessionPlugin(app: FastifyInstance): Promise<void> {
  app.decorateRequest("sessionId", "");

  app.addHook("preHandler", async (request, reply) => {
    let sessionId = request.headers["x-session-id"] as string | undefined;

    if (!sessionId) {
      // Node.js 22+ has crypto.randomUUID() built-in
      sessionId = crypto.randomUUID();
      // Set it on the response so the client can save it
      reply.header("x-session-id", sessionId);
    }

    request.sessionId = sessionId;
  });
}
