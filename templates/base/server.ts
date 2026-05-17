import { createServer, getRoutesDir } from 'lacis'

const routesDir = getRoutesDir()
createServer(routesDir, { platform: 'node', port: 3000 })
