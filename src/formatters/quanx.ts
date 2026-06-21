import type {
  Hysteria2Proxy,
  ProxyNode,
  ShadowsocksProxy,
  TrojanProxy,
  VlessProxy,
  VmessProxy,
} from '../types/proxy.js'

function ssLine(node: ShadowsocksProxy): string {
  return `shadowsocks=${node.server}:${node.port}, method=${node.method}, password=${node.password}, udp-relay=true, tag=${node.name}`
}

function vmessLine(node: VmessProxy): string {
  const parts = [`vmess=${node.server}:${node.port}`, `method=${node.cipher ?? 'none'}`, `password=${node.uuid}`]

  if (node.network === 'ws') {
    const obfs = node.tls ? 'wss' : 'ws'
    parts.push(`obfs=${obfs}`)
    if (node.host) parts.push(`obfs-host=${node.host}`)
    if (node.path) parts.push(`obfs-uri=${node.path}`)
  } else if (node.tls) {
    parts.push('obfs=over-tls')
    if (node.sni) parts.push(`obfs-host=${node.sni}`)
  }

  parts.push('udp-relay=true', `tag=${node.name}`)
  return parts.join(', ')
}

function vlessLine(node: VlessProxy): string {
  const parts = [`vless=${node.server}:${node.port}`, 'method=none', `password=${node.uuid}`]

  const hasTls = node.security === 'tls' || node.security === 'reality'

  if (node.network === 'ws') {
    parts.push(hasTls ? 'obfs=wss' : 'obfs=ws')
    if (node.host) parts.push(`obfs-host=${node.host}`)
    if (node.path) parts.push(`obfs-uri=${node.path}`)
  } else if (hasTls) {
    parts.push('obfs=over-tls')
    if (node.sni) parts.push(`obfs-host=${node.sni}`)
  }

  if (node.security === 'reality' && node.realityPublicKey) {
    parts.push(`reality-base64-pubkey=${node.realityPublicKey}`)
    if (node.realityShortId) parts.push(`reality-hex-shortid=${node.realityShortId}`)
  }

  if (node.flow) parts.push(`vless-flow=${node.flow}`)

  parts.push('udp-relay=true', `tag=${node.name}`)
  return parts.join(', ')
}

function trojanLine(node: TrojanProxy): string {
  const parts = [`trojan=${node.server}:${node.port}`, `password=${node.password}`, 'over-tls=true']
  if (node.sni) parts.push(`tls-host=${node.sni}`)
  parts.push('tls-verification=true', 'udp-relay=true', `tag=${node.name}`)
  return parts.join(', ')
}

function hysteria2Line(node: Hysteria2Proxy): string {
  const parts = [`hysteria2=${node.server}:${node.port}`, `password=${node.password}`]
  if (node.sni) parts.push(`sni=${node.sni}`)
  if (node.insecure) parts.push('tls-verification=false')
  if (node.obfs) parts.push(`obfs=${node.obfs}`)
  if (node.obfsPassword) parts.push(`obfs-password=${node.obfsPassword}`)
  parts.push('udp-relay=true', `tag=${node.name}`)
  return parts.join(', ')
}

function proxyLine(node: ProxyNode): string {
  switch (node.type) {
    case 'shadowsocks': return ssLine(node)
    case 'vmess': return vmessLine(node)
    case 'vless': return vlessLine(node)
    case 'trojan': return trojanLine(node)
    case 'hysteria2': return hysteria2Line(node)
  }
}

export function formatQuanxProxies(nodes: ProxyNode[]): string {
  const lines = nodes.map(proxyLine)
  const tags = nodes.map((n) => n.name)
  return [
    '[server_local]',
    ...lines,
    '',
    '[policy]',
    `static=PROXY, ${tags.join(', ')}, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Proxy.png`,
    `url-latency-benchmark=AUTO, server-tag-regex=.*, check-interval=600, tolerance=0, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Auto.png`,
    '',
    '[filter_local]',
    'final, PROXY',
  ].join('\n')
}
