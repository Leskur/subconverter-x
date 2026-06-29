import { getAppVersion } from '../utils/version.js'

function corsOrigin(): string {
  return process.env.CORS_ORIGIN ?? '*'
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': corsOrigin(),
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

function isAuthEnabled(): boolean {
  return !!process.env.ADMIN_TOKEN
}

export async function handleAdminMeta(): Promise<Response> {
  const version = await getAppVersion()
  return jsonResponse({
    service: 'subconverter-x',
    version,
    authEnabled: isAuthEnabled(),
  })
}
