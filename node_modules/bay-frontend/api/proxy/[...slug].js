const { URL } = require('url')

async function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => resolve(Buffer.concat(chunks)))
        req.on('error', reject)
    })
}

module.exports = async (req, res) => {
    const origin = req.headers.origin || ''
    const allowedOrigin = origin || '*'

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
        res.setHeader('Vary', 'Origin')
        res.setHeader('Access-Control-Allow-Credentials', 'true')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        res.statusCode = 204
        return res.end()
    }

    // Build target URL
    const slug = Array.isArray(req.query.slug) ? req.query.slug.join('/') : (req.query.slug || '')
    const target = new URL(slug, 'https://web-proj.42web.io/bay/')

    // Collect body
    const bodyBuffer = await getRawBody(req)

    // Prepare headers for fetch
    const outgoingHeaders = {}
    for (const [k, v] of Object.entries(req.headers)) {
        if (['host', 'content-length'].includes(k)) continue
        outgoingHeaders[k] = v
    }
    // Spoof a common browser User-Agent and set Origin to the target host to
    // reduce chance of gateway blocking server-to-server requests.
    outgoingHeaders['user-agent'] = outgoingHeaders['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36'
    outgoingHeaders['origin'] = outgoingHeaders['origin'] || 'https://web-proj.42web.io'

    try {
        const fetchRes = await fetch(target.toString(), {
            method: req.method,
            headers: outgoingHeaders,
            body: bodyBuffer.length ? bodyBuffer : undefined,
            redirect: 'manual',
        })

        // Forward status
        res.statusCode = fetchRes.status

        // Forward headers (but enforce CORS)
        const raw = fetchRes.headers && fetchRes.headers.raw ? fetchRes.headers.raw() : {}
        for (const [k, v] of Object.entries(raw)) {
            // Skip hop-by-hop headers
            const lk = k.toLowerCase()
            if (['connection', 'keep-alive', 'transfer-encoding', 'upgrade'].includes(lk)) continue
            if (lk === 'set-cookie') {
                // set-cookie may be an array
                res.setHeader('Set-Cookie', v)
                continue
            }
            // multiple values join with comma
            res.setHeader(k, Array.isArray(v) ? v.join(',') : v)
        }

        // Ensure CORS for browser clients
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
        res.setHeader('Vary', 'Origin')
        res.setHeader('Access-Control-Allow-Credentials', 'true')

        const arrayBuffer = await fetchRes.arrayBuffer()
        res.end(Buffer.from(arrayBuffer))
    } catch (err) {
        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
        res.setHeader('Vary', 'Origin')
        res.setHeader('Access-Control-Allow-Credentials', 'true')
        res.end(JSON.stringify({ success: false, message: 'Proxy error', detail: String(err) }))
    }
}
