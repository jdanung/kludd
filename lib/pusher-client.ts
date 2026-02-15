import PusherClient from 'pusher-js'

function cleanEnv(val: string | undefined): string {
  if (!val) return ''
  return val.split('\n')[0].trim()
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
