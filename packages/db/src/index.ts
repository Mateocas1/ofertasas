import { PrismaClient as PrismaClientType } from "@prisma/client";
import pkg from "@prisma/client";

const PrismaClient = pkg.PrismaClient as typeof PrismaClientType;
export { PrismaClient };
