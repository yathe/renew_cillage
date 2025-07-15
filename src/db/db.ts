import { PrismaClient } from "@prisma/client"

// Create a new Prisma client
const prismaClientSingleton = () => {
  return new PrismaClient()
}

// Let TypeScript know that we might save the Prisma client on the global object
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

// Use the already saved Prisma client if it exists, otherwise create a new one
const db = globalThis.prisma ?? prismaClientSingleton()

// Export the Prisma client so we can use it in other files
export default db

// In development mode, save the Prisma client on the global object
// so Next.js does not create a new one every time the app reloads
if (process.env.NODE_ENV !== "production") globalThis.prisma = db
