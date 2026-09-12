import path from 'node:path'
import { buildApp } from './app.ts'
import { loadCatalog } from './catalog/load.ts'
import { loadConfig } from './config.ts'
import { Database } from './db/database.ts'
import { Store } from './db/store.ts'
import { GenerationQueue } from './jobs/queue.ts'
import { createLlmClient } from './llm/createLlmClient.ts'

const config = loadConfig()
const db = new Database(path.join(config.dataDir, 'app.db'))
const store = new Store(db)
const interrupted = store.failInterruptedGenerations(new Date().toISOString())
const catalog = loadCatalog(config.inventoryDir)
const llm = createLlmClient(config)
const queue = new GenerationQueue({
  store,
  catalog,
  llm,
  config,
  // Human-readable generation progress in the server terminal.
  log: (message, extra) => {
    const line = `[${new Date().toLocaleTimeString()}] [generation] ${message}`
    if (extra) console.log(line, extra)
    else console.log(line)
  },
})

const app = await buildApp({ config, store, catalog, llm, queue }, { logger: true })
queue.kick()
await app.listen({ host: config.host, port: config.port })
app.log.info(
  { catalogVersion: catalog.version, items: catalog.items.length, skipped: catalog.skipped.length, llm: llm?.id ?? 'none', interrupted },
  'interior backend ready',
)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    queue.stop()
    await app.close()
    db.close()
    process.exit(0)
  })
}
