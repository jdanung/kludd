import Pusher from 'pusher'

function cleanEnv(val: string | undefined): string {
  if (!val) return ''
  return val.split('\n')[0].trim()
}

let pusherServer: Pusher | null = null

export function getPusherServer(): Pusher {
  const appId = cleanEnv(process.env.PUSHER_APP_ID) || 'placeholder'
  const key = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_KEY) || 'placeholder'
  const secret = cleanEnv(process.env.PUSHER_SECRET) || 'placeholder'
  const cluster = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_CLUSTER) || 'eu'

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
