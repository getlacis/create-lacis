import type { Request, Response } from 'lacis'

export const GET = async (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Hello from lacis!' })
}
