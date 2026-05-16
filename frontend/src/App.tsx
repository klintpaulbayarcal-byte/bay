import React, { useEffect, useState } from 'react'
import supabase from './lib/supabaseClient'

export default function App() {
    const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
    const [msg, setMsg] = useState<string>('')

    useEffect(() => {
        const check = async () => {
            setStatus('checking')
            try {
                const { data, error } = await supabase.from('test').select('*').limit(1)
                if (error) {
                    setStatus('error')
                    setMsg(error.message)
                } else {
                    setStatus('ok')
                    setMsg(JSON.stringify(data))
                }
            } catch (e: any) {
                setStatus('error')
                setMsg(e?.message ?? String(e))
            }
        }
        check()
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="p-8 bg-white rounded shadow max-w-xl">
                <h1 className="text-2xl font-bold">Bay - React + Vite + Tailwind</h1>
                <p className="mt-2 text-gray-600">Prototype connected to existing PHP APIs or Supabase.</p>

                <div className="mt-4">
                    <h2 className="font-semibold">Supabase connection</h2>
                    <p className="text-sm text-gray-600">Status: <span className="font-medium">{status}</span></p>
                    {msg && <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">{msg}</pre>}
                    <p className="mt-2 text-xs text-gray-500">Tip: create a `test` table in Supabase, or update the query in `src/lib/supabaseClient.ts`.</p>
                </div>
            </div>
        </div>
    )
}
