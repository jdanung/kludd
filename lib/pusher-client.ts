import PusherClient from 'pusher-js'

function cleanEnv(val: string | undefined): string {
  if (!val) return ''
  // Ta bort ALLA radbrytningar, mellanslag i början/slutet och andra skräptecken
  return val
    .replace(/[\r\n\t]/g, '') // Ta bort radbrytningar, tabbar
    .replace(/\s+$/g, '') // Ta bort whitespace i slutet
    .replace(/^\s+/g, '') // Ta bort whitespace i början
    .trim()
}

let pusherClient: PusherClient | null = null

export function getPusherClient(): PusherClient {
  const key = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_KEY) || ''
  const cluster = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_CLUSTER) || 'eu'

  if (!pusherClient) {
    pusherClient = new PusherClient(key, {
      cluster,
    })
  }
  return pusherClient
}
