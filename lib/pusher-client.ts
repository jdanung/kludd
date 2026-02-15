import PusherClient from 'pusher-js'

let pusherClient: PusherClient | null = null

export function getPusherClient(): PusherClient {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || ''
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || ''

  if (!pusherClient) {
    pusherClient = new PusherClient(key, {
      cluster,
    })
  }
  return pusherClient
}
