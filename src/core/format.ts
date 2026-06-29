import type { ClientType, ProxyNode } from './types.js'
import type { UpdateIntervalMode } from '../subscription/types.js'
import { formatClashProxies } from '../formatters/clash.js'
import { formatSingboxOutbounds } from '../formatters/singbox.js'
import { formatLoonProxies } from '../formatters/loon.js'
import { formatQuanxProxies } from '../formatters/quanx.js'
import { formatSurfboardProxies } from '../formatters/surfboard.js'

import type { ClashExtras } from '../rules/merge.js'

export function formatProxies(
  nodes: ProxyNode[],
  client: ClientType,
  clashExtras?: ClashExtras,
  managedConfigUrl?: string,
  updateInterval?: UpdateIntervalMode,
): { body: string; contentType: string } {
  switch (client) {
    case 'clash':
    case 'surge':
      return {
        body: formatClashProxies(nodes, clashExtras, updateInterval),
        contentType: 'application/yaml; charset=utf-8',
      }
    case 'surfboard':
      return {
        body: formatSurfboardProxies(nodes, managedConfigUrl, clashExtras, updateInterval),
        contentType: 'text/plain; charset=utf-8',
      }
    case 'loon':
      return {
        body: formatLoonProxies(nodes, clashExtras, managedConfigUrl, updateInterval),
        contentType: 'text/plain; charset=utf-8',
      }
    case 'quanx':
      return {
        body: formatQuanxProxies(nodes, clashExtras),
        contentType: 'text/plain; charset=utf-8',
      }
    case 'singbox':
    default:
      return {
        body: formatSingboxOutbounds(nodes),
        contentType: 'application/json; charset=utf-8',
      }
  }
}
