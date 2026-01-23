import { TRPCError } from "@trpc/server";
import { getDb } from "../db";

export async function ensureDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database connection not available",
    });
  }
  return db;
}
