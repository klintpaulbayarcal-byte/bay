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
        const backendUrl = 'https://web-proj.42web.io/bay/auth_api.php';

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Vercel Proxy)',
            },
            body: JSON.stringify(req.body),
            credentials: 'include',
        });

        const data = await response.json();

        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({
            success: false,
            message: `Proxy error: ${error.message}`,
        });
    }
}
