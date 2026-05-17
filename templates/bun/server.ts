import { createServer, getRoutesDir } from 'lacis'

const routesDir = getRoutesDir()
createServer(routesDir, { platform: 'bun', port: 3000 })
