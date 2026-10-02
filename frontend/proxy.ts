import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ORIGIN_SECRET_HEADER = 'x-origin-secret'

/**
 * Verrou d'origine : ajoute le secret partagé aux requêtes /api avant qu'elles soient
 * transmises au backend par le rewrite de next.config.ts (exécuté après ce proxy).
 * Le backend refuse les requêtes sans ce secret : il n'est joignable qu'en passant par ce front.
 *
 * ORIGIN_SECRET est une variable serveur : ne jamais la préfixer par NEXT_PUBLIC_,
 * sinon elle serait incluse dans le JavaScript envoyé au navigateur.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  // On écrase toute valeur envoyée par le client
  headers.delete(ORIGIN_SECRET_HEADER)

  const secret = process.env.ORIGIN_SECRET
  if (secret) {
    headers.set(ORIGIN_SECRET_HEADER, secret)
  }

  // request.headers : transmis au backend (et non renvoyés au navigateur)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: '/api/:path*',
}
