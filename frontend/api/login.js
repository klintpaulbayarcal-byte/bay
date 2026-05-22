const crypto = require('crypto')

function solveChallengeCookie(html) {
    const matches = [...html.matchAll(/toNumbers\("([0-9a-f]+)"\)/gi)].map((match) => match[1])
    const [keyHex, ivHex, ctHex] = matches

    if (!keyHex || !ivHex || !ctHex) {
        throw new Error('Unable to parse backend challenge cookie')
    }

    const decipher = crypto.createDecipheriv(
        'aes-128-cbc',
        Buffer.from(keyHex, 'hex'),
        Buffer.from(ivHex, 'hex'),
    )

    decipher.setAutoPadding(false)

    return Buffer.concat([
        decipher.update(Buffer.from(ctHex, 'hex')),
        decipher.final(),
    ]).toString('hex')
}

async function requestBackendLogin(body, cookieValue = '') {
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Vercel Proxy)',
        'Origin': 'https://web-proj.42web.io',
        'Referer': 'https://web-proj.42web.io/bay/auth_api.php',
    }

    if (cookieValue) {
        headers.Cookie = `__test=${cookieValue}`
    }

    return fetch('https://web-proj.42web.io/bay/auth_api.php', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    })
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(400).json({ success: false, message: 'Only POST allowed' });
    }

    try {
        const firstResponse = await requestBackendLogin(req.body)
        const firstText = await firstResponse.text()

        let responseText = firstText

        if (/slowAES\.decrypt|document\.cookie="__test=/i.test(firstText)) {
            const cookieValue = solveChallengeCookie(firstText)
            const retryResponse = await requestBackendLogin(req.body, cookieValue)
            responseText = await retryResponse.text()

            if (/slowAES\.decrypt|document\.cookie="__test=/i.test(responseText)) {
                return res.status(502).json({
                    success: false,
                    message: 'Proxy error: backend challenge could not be solved',
                })
            }

            res.statusCode = retryResponse.status
            res.setHeader('Content-Type', 'application/json')
            return res.end(responseText)
        }

        res.statusCode = firstResponse.status
        res.setHeader('Content-Type', 'application/json')
        return res.end(responseText)
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({
            success: false,
            message: `Proxy error: ${error.message}`,
        });
    }
}
