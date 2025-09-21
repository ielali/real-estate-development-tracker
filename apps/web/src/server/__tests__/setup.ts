import { beforeAll, afterAll } from "vitest"
import * as fs from "fs"

beforeAll(() => {
  process.env.DATABASE_URL = "file:./test.db"
})

afterAll(() => {
  const testDbPath = "./test.db"
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
  }
  if (fs.existsSync(`${testDbPath}-shm`)) {
    fs.unlinkSync(`${testDbPath}-shm`)
  }
  if (fs.existsSync(`${testDbPath}-wal`)) {
    fs.unlinkSync(`${testDbPath}-wal`)
  }
})
