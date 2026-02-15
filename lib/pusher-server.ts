import Pusher from 'pusher'

let pusherServer: Pusher | null = null

export function getPusherServer(): Pusher {
  const appId = process.env.PUSHER_APP_ID || 'placeholder'
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || 'placeholder'
  const secret = process.env.PUSHER_SECRET || 'placeholder'
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu'

  if (!pusherServer) {
    pusherServer = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    })
  }
  return pusherServer
}
