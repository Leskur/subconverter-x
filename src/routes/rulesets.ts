import { rulesetsStore, type CustomRuleset } from '../rules/rulesets-store.js'

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

function isAuthorized(request: Request): boolean {
  const token = process.env.ADMIN_TOKEN
  if (!token) return true

  const header = request.headers.get('authorization')
  return header === `Bearer ${token}`
}

export async function handleRulesetsApi(request: Request): Promise<Response> {
  if (request.method === 'GET') {
    const rulesets = await rulesetsStore.getAll()
    return jsonResponse(rulesets)
  }

  if (request.method === 'PUT') {
    if (!isAuthorized(request)) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }
    let body: CustomRuleset[]
    try {
      body = (await request.json()) as CustomRuleset[]
      if (!Array.isArray(body)) throw new Error('Expected array')
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }
    const saved = await rulesetsStore.save(body)
    return jsonResponse(saved)
  }

  return jsonResponse({ error: 'Method Not Allowed' }, 405)
}
