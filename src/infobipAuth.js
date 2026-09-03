// Geração de JWT (HS256) para autenticação do widget Live Chat da Infobip.
//
// ⚠️ ATENÇÃO DE SEGURANÇA:
// A secret key abaixo fica EXPOSTA no bundle do frontend. Qualquer usuário
// consegue extraí-la e forjar tokens para qualquer externalPersonId.
// Isso é aceitável apenas para TESTES. Em produção, a assinatura do JWT
// deveria acontecer em um backend/serverless confiável.
//
// Doc: https://www.infobip.com/docs/live-chat/users-and-authentication#web-authentication

export const WIDGET_ID = '71212ac3-36e7-47fc-bc5f-2508e308450a' // usado no liveChat('init', ...)

const SECURITY_KEY = {
  id: '4885d715-ed13-43d3-bf39-39eea1331cd4',
  key: 'AjmMjyn2bI462pSr01WivTn6J3ljBXrWmxLYdyS0jkM=',
}

// --- helpers base64url ---

function base64UrlFromBytes(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlFromString(str) {
  return base64UrlFromBytes(new TextEncoder().encode(str))
}

function bytesFromBase64(b64) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Cria um JWT assinado (HS256) para autenticar o usuário no Live Chat.
 * @param {string} externalPersonId - identificador externo do usuário.
 * @param {object} [options]
 * @param {number} [options.ttlSeconds=60] - validade do token em segundos.
 * @returns {Promise<string>} token JWT compacto.
 */
export async function createInfobipJwt(externalPersonId, { ttlSeconds = 60 } = {}) {
  const now = Math.floor(Date.now() / 1000)

  const header = { alg: 'HS256', typ: 'JWT' }

  const payload = {
    iat: now,
    exp: now + ttlSeconds,
    iss: WIDGET_ID,
    jti: crypto.randomUUID(),
    ski: SECURITY_KEY.id,
    stp: 'externalPersonId',
    sub: String(externalPersonId),
  }

  const encodedHeader = base64UrlFromString(JSON.stringify(header))
  const encodedPayload = base64UrlFromString(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  // A secret key vem em base64 e precisa ser decodificada antes de assinar.
  const keyBytes = bytesFromBase64(SECURITY_KEY.key)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  )

  const encodedSignature = base64UrlFromBytes(new Uint8Array(signatureBuffer))

  return `${signingInput}.${encodedSignature}`
}
