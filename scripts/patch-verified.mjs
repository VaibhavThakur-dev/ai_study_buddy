// One-time script: backfill isVerified=true for all users created before the field existed
// Run: node scripts/patch-verified.mjs
import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

await mongoose.connect(process.env.MONGODB_URI)

const result = await mongoose.connection.db
  .collection('users')
  .updateMany(
    { isVerified: { $exists: false } },
    { $set: { isVerified: true } }
  )

console.log(`Patched ${result.modifiedCount} user(s) → isVerified: true`)
await mongoose.disconnect()
