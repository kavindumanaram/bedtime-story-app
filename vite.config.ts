import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs/promises'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'

const DB_PATH = path.resolve(__dirname, 'data/db.json')
const EMPTY_DB = JSON.stringify({ stories: [] }, null, 2)

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'db-api',
      configureServer(server) {
        server.middlewares.use('/api/db', async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')

          if (req.method === 'GET') {
            try {
              const content = await fs.readFile(DB_PATH, 'utf-8')
              res.end(content)
            } catch {
              res.end(EMPTY_DB)
            }
          } else if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk: Buffer) => { body += chunk.toString() })
            req.on('end', async () => {
              await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
              await fs.writeFile(DB_PATH, body, 'utf-8')
              res.end(JSON.stringify({ ok: true }))
            })
          } else {
            res.statusCode = 405
            res.end(JSON.stringify({ error: 'Method not allowed' }))
          }
        })
      },
    },
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
