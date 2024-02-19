import { PrismaClient } from '@prisma/client'
import { pagination } from 'prisma-extension-pagination'

const prisma = new PrismaClient().$extends(pagination())
export default prisma
