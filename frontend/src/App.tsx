import React, { useEffect, useMemo, useState } from 'react'

type PageName = 'login' | 'signup' | 'cafe' | 'track'

type Product = {
    id: number
    name: string
    category: string
    description: string
    price: number
    stock: number
    image: string
    featured?: boolean
}

type CartItem = Product & { quantity: number }

type NavigateFn = (path: string) => void

type LoginState = {
    username: string
    password: string
    rememberMe: boolean
    showPassword: boolean
    message: string
    messageType: 'error' | 'success' | ''
}

type SignupState = {
    fullname: string
    email: string
    username: string
    password: string
    confirmPassword: string
    message: string
    messageType: 'error' | 'success' | ''
}

type ApiProduct = {
    id: number | string
    name: string
    category: string
    description: string
    price: number | string
    image_url?: string
    image?: string
    stock_quantity?: number | string
    stock?: number | string
}

const fallbackProducts: Product[] = [
    {
        id: 1,
        name: 'Americano',
        category: 'coffee',
        description: 'Espresso topped with hot water.',
        price: 140,
        stock: 20,
        image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=900&h=700&fit=crop',
        featured: true,
    },
    {
        id: 2,
        name: 'Cappuccino',
        category: 'coffee',
        description: 'Espresso with steamed milk and foam.',
        price: 165,
        stock: 17,
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&h=700&fit=crop',
        featured: true,
    },
    {
        id: 3,
        name: 'Caramel Macchiato',
        category: 'coffee',
        description: 'Espresso with steamed milk and sweet caramel drizzle.',
        price: 180,
        stock: 15,
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&h=700&fit=crop',
        featured: true,
    },
    {
        id: 4,
        name: 'Latte',
        category: 'coffee',
        description: 'Smooth espresso and milk for a creamy finish.',
        price: 160,
        stock: 12,
        image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=900&h=700&fit=crop',
    },
    {
        id: 5,
        name: 'Iced Tea Lemon',
        category: 'non-coffee',
        description: 'Refreshing brewed tea with citrus.',
        price: 110,
        stock: 14,
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=900&h=700&fit=crop',
    },
    {
        id: 6,
        name: 'Chocolate Muffin',
        category: 'pastry',
        description: 'Freshly baked chocolate muffin.',
        price: 85,
        stock: 8,
        image: 'https://images.unsplash.com/photo-1604882406195-d94d4f33b0a9?w=900&h=700&fit=crop',
    },
    {
        id: 7,
        name: 'Ham and Cheese Sandwich',
        category: 'food',
        description: 'Toasted sandwich with ham and cheese.',
        price: 180,
        stock: 6,
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&h=700&fit=crop',
    },
]

function currency(value: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
}

function stockLabel(stock: number) {
    if (stock <= 0) return { text: 'Out of stock', className: 'stock-out' }
    if (stock <= 5) return { text: `Stock: ${stock}`, className: 'stock-low' }
    return { text: `Stock: ${stock}`, className: 'stock-ok' }
}

function getPageFromPath(pathname: string): PageName {
    const path = pathname.toLowerCase()
    if (path.includes('signup')) return 'signup'
    if (path.includes('track')) return 'track'
    if (path.includes('cafe') || path.includes('menu') || path.includes('order')) return 'cafe'
    return 'login'
}

const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/$/, '') ?? ''

function apiUrl(path: string) {
    return apiBase ? `${apiBase}${path}` : `/api${path}`
}

function backendUrl(path: string) {
    const base = apiBase || 'http://localhost/bay'
    return `${base}${path}`
}

function mapApiProduct(product: ApiProduct): Product {
    return {
        id: Number(product.id),
        name: product.name,
        category: product.category || 'coffee',
        description: product.description || '',
        price: Number(product.price) || 0,
        stock: Number(product.stock_quantity ?? product.stock ?? 0),
        image: product.image_url || product.image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&h=700&fit=crop',
        featured: ['espresso', 'americano', 'cappuccino', 'latte', 'macchiato'].some((tag) => product.name.toLowerCase().includes(tag)),
    }
}

function LoginPage({ navigate }: { navigate: NavigateFn }) {
    const [state, setState] = useState<LoginState>({
        username: '',
        password: '',
        rememberMe: false,
        showPassword: false,
        message: '',
        messageType: '',
    })

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!state.username.trim()) {
            setState((current) => ({ ...current, message: 'Username is required', messageType: 'error' }))
            return
        }

        if (!state.password.trim()) {
            setState((current) => ({ ...current, message: 'Password is required', messageType: 'error' }))
            return
        }

        try {
            const response = await fetch(apiUrl('/auth_api.php'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    username: state.username,
                    password: state.password,
                }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Login failed')
            }

            setState((current) => ({ ...current, message: data.message || 'Login successful', messageType: 'success' }))

            if (data.role === 'admin' || data.role === 'staff') {
                window.location.assign(backendUrl(`/${data.redirect_to || 'staff_panel.php'}`))
                return
            }

            navigate('/cafe')
        } catch (error) {
            setState((current) => ({
                ...current,
                message: error instanceof Error ? error.message : 'Unable to login',
                messageType: 'error',
            }))
        }
    }

    return (
        <div className="auth-page">
            <div className="signin-shell row g-0">
                <div className="col-md-6 signin-left d-flex flex-column justify-content-center">
                    <span className="brand-chip">
                        <span className="brand-dot" />
                        KLINT&apos;S CAFE
                    </span>
                    <h2>Your Premium<br />Cafe Experience</h2>
                    <p>Staff and customer access to browse the menu, manage orders, and use the React-based cafe system.</p>
                    <ul className="feature-stack">
                        <li>Modern login screen converted from your HTML version</li>
                        <li>Posts to the existing PHP auth backend</li>
                        <li>Guests can open the React cafe menu directly</li>
                    </ul>
                </div>

                <div className="col-md-6 signin-right">
                    <form onSubmit={submit}>
                        <h1 className="signin-title h3">Staff Sign In</h1>
                        <p className="signin-subtitle">Access your management dashboard</p>

                        {state.message && <div className={`alert ${state.messageType === 'error' ? 'alert-danger' : 'alert-success'}`}>{state.message}</div>}

                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-control mb-3"
                            id="username"
                            value={state.username}
                            onChange={(event) => setState((current) => ({ ...current, username: event.target.value }))}
                            placeholder="Enter username"
                            autoComplete="username"
                        />

                        <label htmlFor="password" className="form-label">Password</label>
                        <div className="input-group mb-3">
                            <input
                                type={state.showPassword ? 'text' : 'password'}
                                className="form-control"
                                id="password"
                                value={state.password}
                                onChange={(event) => setState((current) => ({ ...current, password: event.target.value }))}
                                placeholder="Enter password"
                                autoComplete="current-password"
                            />
                            <button
                                className="btn password-toggle"
                                type="button"
                                onClick={() => setState((current) => ({ ...current, showPassword: !current.showPassword }))}
                            >
                                {state.showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        <div className="form-check mb-4">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="rememberMe"
                                checked={state.rememberMe}
                                onChange={(event) => setState((current) => ({ ...current, rememberMe: event.target.checked }))}
                            />
                            <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
                        </div>

                        <button className="btn btn-primary w-100" type="submit">Sign In</button>

                        <div className="auth-link-box">
                            <p>Guest Customer?</p>
                            <button className="btn auth-outline-btn w-100" type="button" onClick={() => navigate('/cafe')}>
                                Browse Menu & Order
                            </button>
                        </div>

                        <p className="text-center signin-footer">
                            New staff? <button type="button" className="text-link-btn" onClick={() => navigate('/signup')}>Request access</button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}

function SignupPage({ navigate }: { navigate: NavigateFn }) {
    const [state, setState] = useState<SignupState>({
        fullname: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        message: '',
        messageType: '',
    })

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!state.fullname.trim()) return setState((current) => ({ ...current, message: 'Full name is required', messageType: 'error' }))
        if (!state.email.trim()) return setState((current) => ({ ...current, message: 'Email is required', messageType: 'error' }))
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
            return setState((current) => ({ ...current, message: 'Please enter a valid email address', messageType: 'error' }))
        }
        if (!state.username.trim()) return setState((current) => ({ ...current, message: 'Username is required', messageType: 'error' }))
        if (state.password.length < 6) return setState((current) => ({ ...current, message: 'Password must be at least 6 characters', messageType: 'error' }))
        if (state.password !== state.confirmPassword) return setState((current) => ({ ...current, message: 'Passwords do not match', messageType: 'error' }))

        try {
            const response = await fetch(apiUrl('/auth_api.php'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'register',
                    fullname: state.fullname,
                    email: state.email,
                    username: state.username,
                    password: state.password,
                    confirmPassword: state.confirmPassword,
                }),
            })

            const data = await response.json()
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Registration failed')
            }

            setState((current) => ({
                ...current,
                message: data.message || 'Registration successful',
                messageType: 'success',
            }))

            window.setTimeout(() => navigate('/'), 900)
        } catch (error) {
            setState((current) => ({
                ...current,
                message: error instanceof Error ? error.message : 'Unable to register',
                messageType: 'error',
            }))
        }
    }

    return (
        <div className="auth-page">
            <div className="signup-shell row g-0">
                <div className="col-md-6 signup-left d-flex flex-column justify-content-center">
                    <span className="brand-chip">
                        <span className="brand-dot" />
                        BAY ACCESS
                    </span>
                    <h2>Create Your Secure<br />Workspace Account</h2>
                    <p>Set up your account in a few steps and start using the React cafe system.</p>
                    <ul className="feature-stack">
                        <li>Simple registration with instant validation</li>
                        <li>Connected to the PHP registration backend</li>
                        <li>Quick access to your personalized dashboard</li>
                    </ul>
                </div>

                <div className="col-md-6 signup-right">
                    <form onSubmit={submit}>
                        <h1 className="signup-title h3">Create Account</h1>
                        <p className="signup-subtitle">Enter your details to register.</p>

                        {state.message && <div className={`alert ${state.messageType === 'error' ? 'alert-danger' : 'alert-success'}`}>{state.message}</div>}

                        <label htmlFor="fullname" className="form-label">Full Name</label>
                        <input className="form-control mb-3" id="fullname" value={state.fullname} onChange={(event) => setState((current) => ({ ...current, fullname: event.target.value }))} placeholder="Enter full name" />

                        <label htmlFor="email" className="form-label">Email</label>
                        <input className="form-control mb-3" id="email" type="email" value={state.email} onChange={(event) => setState((current) => ({ ...current, email: event.target.value }))} placeholder="Enter email address" />

                        <label htmlFor="username" className="form-label">Username</label>
                        <input className="form-control mb-3" id="username" value={state.username} onChange={(event) => setState((current) => ({ ...current, username: event.target.value }))} placeholder="Choose a username" />

                        <label htmlFor="password" className="form-label">Password</label>
                        <input className="form-control mb-3" id="password" type="password" value={state.password} onChange={(event) => setState((current) => ({ ...current, password: event.target.value }))} placeholder="Enter password" />

                        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                        <input className="form-control mb-3" id="confirmPassword" type="password" value={state.confirmPassword} onChange={(event) => setState((current) => ({ ...current, confirmPassword: event.target.value }))} placeholder="Confirm password" />

                        <button className="btn btn-primary w-100 mt-2" type="submit">Create Account</button>

                        <p className="text-center signup-footer">
                            Already have an account? <button type="button" className="text-link-btn" onClick={() => navigate('/')}>Sign In</button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}

function TrackOrderPage({ navigate }: { navigate: NavigateFn }) {
    const [orderId, setOrderId] = useState('')
    const [identity, setIdentity] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const [order, setOrder] = useState<Record<string, unknown> | null>(null)
    const [timeline, setTimeline] = useState<Array<Record<string, unknown>>>([])

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!orderId.trim() || !identity.trim()) {
            setStatus('error')
            setMessage('Order ID and customer name/phone are required')
            return
        }

        setStatus('loading')
        setMessage('Checking order status...')

        try {
            const query = new URLSearchParams({ order_id: orderId.trim(), identity: identity.trim() })
            const response = await fetch(`${apiUrl('/order_status_api.php')}?${query.toString()}`)
            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to find order')
            }

            setOrder(data.order || null)
            setTimeline(Array.isArray(data.timeline) ? data.timeline : [])
            setStatus('success')
            setMessage('Order found')
        } catch (error) {
            setOrder(null)
            setTimeline([])
            setStatus('error')
            setMessage(error instanceof Error ? error.message : 'Unable to find order')
        }
    }

    return (
        <div className="auth-page">
            <div className="signup-shell row g-0">
                <div className="col-md-6 signup-left d-flex flex-column justify-content-center">
                    <span className="brand-chip">
                        <span className="brand-dot" />
                        KLINT&apos;S CAFE
                    </span>
                    <h2>Track Your<br />Order Status</h2>
                    <p>Enter your order details to view current status and timeline updates from the backend.</p>
                    <ul className="feature-stack">
                        <li>Connected to <strong>order_status_api.php</strong></li>
                        <li>Shows live order state and timeline</li>
                        <li>Use order ID + your name or phone</li>
                    </ul>
                </div>

                <div className="col-md-6 signup-right">
                    <form onSubmit={submit}>
                        <h1 className="signup-title h3">Track Order</h1>
                        <p className="signup-subtitle">Check your current order progress</p>

                        {message && <div className={`alert ${status === 'error' ? 'alert-danger' : 'alert-success'}`}>{message}</div>}

                        <label htmlFor="trackOrderId" className="form-label">Order ID</label>
                        <input
                            id="trackOrderId"
                            className="form-control mb-3"
                            value={orderId}
                            onChange={(event) => setOrderId(event.target.value)}
                            placeholder="e.g. 25"
                        />

                        <label htmlFor="trackIdentity" className="form-label">Name or Phone</label>
                        <input
                            id="trackIdentity"
                            className="form-control mb-3"
                            value={identity}
                            onChange={(event) => setIdentity(event.target.value)}
                            placeholder="John Doe or 09xxxxxxxxx"
                        />

                        <button className="btn btn-primary w-100 mt-2" type="submit" disabled={status === 'loading'}>
                            {status === 'loading' ? 'Checking...' : 'Track Now'}
                        </button>

                        <p className="text-center signup-footer">
                            Back to menu? <button type="button" className="text-link-btn" onClick={() => navigate('/cafe')}>Open Cafe</button>
                        </p>
                    </form>

                    {order && (
                        <div className="alert alert-info mt-3">
                            <div><strong>Status:</strong> {String(order.status ?? 'unknown')}</div>
                            <div><strong>Total:</strong> {String(order.total ?? '0')}</div>
                            <div><strong>Order type:</strong> {String(order.order_type ?? 'pickup')}</div>
                            {timeline.length > 0 && (
                                <ul className="mb-0 mt-2">
                                    {timeline.map((item, index) => (
                                        <li key={`${String(item.status ?? 'status')}-${index}`}>
                                            {String(item.status ?? 'status')} - {String(item.note ?? '')}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function CafePage({ navigate }: { navigate: NavigateFn }) {
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [search, setSearch] = useState('')
    const [cart, setCart] = useState<CartItem[]>([])
    const [products, setProducts] = useState<Product[]>(fallbackProducts)
    const [customer, setCustomer] = useState({
        name: 'John Doe',
        phone: '09xx xxx xxxx',
        orderType: 'Pickup',
        paymentMethod: 'Cash on Delivery',
        notes: '',
    })
    const [backendMessage, setBackendMessage] = useState('Loading menu from the cafe database...')
    const [checkoutState, setCheckoutState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
    const [checkoutMessage, setCheckoutMessage] = useState('')

    useEffect(() => {
        let alive = true

        async function loadProducts() {
            try {
                const response = await fetch(apiUrl('/products_api.php'))
                const data = await response.json()

                if (!response.ok || !data.success || !Array.isArray(data.products)) {
                    throw new Error(data.message || 'Unable to load products')
                }

                const mappedProducts = data.products.map(mapApiProduct)

                if (alive && mappedProducts.length > 0) {
                    setProducts(mappedProducts)
                    setBackendMessage(`Loaded ${mappedProducts.length} menu items from the cafe database.`)
                }
            } catch {
                if (alive) {
                    setBackendMessage('Using built-in demo menu because the backend is unavailable right now.')
                }
            }
        }

        loadProducts()

        return () => {
            alive = false
        }
    }, [])

    const visibleProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
            const matchesSearch = `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(search.toLowerCase())
            return matchesCategory && matchesSearch
        })
    }, [products, search, selectedCategory])

    const categories = useMemo(
        () => ['all', ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))],
        [products],
    )

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0)
    const lowStockCount = products.filter((product) => product.stock <= 5).length

    function addToCart(product: Product) {
        setCart((current) => {
            const existing = current.find((item) => item.id === product.id)
            if (existing) {
                return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
            }
            return [...current, { ...product, quantity: 1 }]
        })
    }

    function changeQuantity(id: number, delta: number) {
        setCart((current) =>
            current
                .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
                .filter((item) => item.quantity > 0),
        )
    }

    async function placeOrder() {
        if (cart.length === 0) {
            setCheckoutState('error')
            setCheckoutMessage('Cart is empty')
            return
        }

        setCheckoutState('submitting')
        setCheckoutMessage('Submitting order...')

        try {
            const response = await fetch(apiUrl('/place_order.php'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: customer.name,
                    customer_phone: customer.phone,
                    note: customer.notes,
                    order_type: customer.orderType.toLowerCase() === 'delivery' ? 'delivery' : 'pickup',
                    payment_method: customer.paymentMethod.toLowerCase().includes('gcash')
                        ? 'gcash'
                        : customer.paymentMethod.toLowerCase().includes('card')
                            ? 'card'
                            : customer.paymentMethod.toLowerCase().includes('cash')
                                ? 'cash'
                                : 'cod',
                    items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
                }),
            })

            const data = await response.json()
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to place order')
            }

            setCart([])
            setCheckoutState('success')
            setCheckoutMessage(`Order placed successfully. Order code: ${data.order_code || data.order_id}`)
        } catch (error) {
            setCheckoutState('error')
            setCheckoutMessage(error instanceof Error ? error.message : 'Unable to place order')
        }
    }

    return (
        <div className="cafe-page">
            <header className="cafe-header">
                <div className="header-wrap">
                    <div className="brand-block">
                        <span className="brand-name">Klint&apos;s Cafe</span>
                    </div>

                    <div className="header-actions">
                        <button type="button" className="header-link" onClick={() => navigate('/track')}>Track Order</button>
                        <button type="button" className="header-link" onClick={() => navigate('/')}>Staff Login</button>
                    </div>
                </div>
            </header>

            <section className="hero-banner">
                <div className="hero-overlay">
                    <p className="hero-kicker">React version of your cafe system</p>
                    <h1>Order Menu</h1>
                    <p>
                        This React frontend now follows your cafe layout: product cards on the left and the order panel on the right.
                    </p>
                    <div className="hero-actions">
                        <button type="button" className="hero-btn primary" onClick={() => document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' })}>
                            Browse menu
                        </button>
                        <button type="button" className="hero-btn" onClick={() => document.querySelector('#cart')?.scrollIntoView({ behavior: 'smooth' })}>
                            Open order panel
                        </button>
                    </div>
                </div>
            </section>

            <section className="stats-section">
                <div className="stats-grid">
                    <div className="stat-card"><span className="stat-value">{products.length}</span><span className="stat-label">Menu items</span></div>
                    <div className="stat-card"><span className="stat-value">{categories.length - 1}</span><span className="stat-label">Categories</span></div>
                    <div className="stat-card"><span className="stat-value">{totalStock}</span><span className="stat-label">Total stock</span></div>
                    <div className="stat-card"><span className="stat-value">{lowStockCount}</span><span className="stat-label">Low stock items</span></div>
                    <div className="stat-card"><span className="stat-value">{totalItems}</span><span className="stat-label">Cart items</span></div>
                </div>
            </section>

            <section className="menu-section" id="menu">
                <div className="menu-content">
                    <div className="menu-header">
                        <h2>Available products</h2>
                        <p>Use the filters and add buttons like the current cafe page.</p>

                        <div className="menu-toolbar">
                            <div className="category-filters">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(category)}
                                        type="button"
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>

                            <input
                                type="search"
                                className="menu-search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search menu items..."
                            />
                        </div>
                    </div>

                    <div className="menu-grid">
                        {visibleProducts.map((product) => {
                            const stock = stockLabel(product.stock)
                            return (
                                <article className="menu-item" key={product.id}>
                                    <img src={product.image} alt={product.name} />
                                    <h3>{product.name}</h3>
                                    {product.featured && <span className="featured-tag">Best Seller</span>}
                                    <span className="category-badge">{product.category}</span>
                                    <span className={`stock-badge ${stock.className}`}>{stock.text}</span>
                                    <p>{product.description}</p>
                                    <div className="menu-item-footer">
                                        <span className="menu-price">{currency(product.price)}</span>
                                        <button className="add-btn" type="button" onClick={() => addToCart(product)} disabled={product.stock <= 0}>
                                            Add
                                        </button>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </div>

                <aside className="order-sidebar" id="cart">
                    <h2>Your Order</h2>

                    <form className="customer-form">
                        <label htmlFor="name">Your name*</label>
                        <input id="name" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} />

                        <label htmlFor="phone">Phone</label>
                        <input id="phone" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} />

                        <label htmlFor="orderType">Order type</label>
                        <select id="orderType" value={customer.orderType} onChange={(event) => setCustomer({ ...customer, orderType: event.target.value })}>
                            <option>Pickup</option>
                            <option>Dine In</option>
                        </select>

                        <label htmlFor="paymentMethod">Payment method</label>
                        <select id="paymentMethod" value={customer.paymentMethod} onChange={(event) => setCustomer({ ...customer, paymentMethod: event.target.value })}>
                            <option>Cash on Delivery</option>
                            <option>GCash</option>
                            <option>Card</option>
                        </select>

                        <label htmlFor="notes">Special notes</label>
                        <textarea
                            id="notes"
                            rows={4}
                            value={customer.notes}
                            onChange={(event) => setCustomer({ ...customer, notes: event.target.value })}
                            placeholder="Any special requests?"
                        />
                    </form>

                    <div className="cart-items">
                        {cart.length === 0 ? (
                            <p className="cart-empty">Cart is empty</p>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <div>
                                        <strong>{item.name}</strong>
                                        <p>
                                            {currency(item.price)} x {item.quantity}
                                        </p>
                                    </div>
                                    <div className="cart-controls">
                                        <button type="button" onClick={() => changeQuantity(item.id, -1)}>-</button>
                                        <button type="button" onClick={() => changeQuantity(item.id, 1)}>+</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cart-summary">
                        <p>Total items: {totalItems}</p>
                        <h3>{currency(totalPrice)}</h3>
                        <button type="button" className="place-order-btn" onClick={placeOrder} disabled={checkoutState === 'submitting'}>
                            {checkoutState === 'submitting' ? 'Placing order...' : 'Place order'}
                        </button>
                        {checkoutMessage && (
                            <div className={`alert mt-3 ${checkoutState === 'error' ? 'alert-danger' : 'alert-success'}`}>
                                {checkoutMessage}
                            </div>
                        )}
                    </div>

                    <div className="supabase-note">
                        <h3>Backend status</h3>
                        <p>{backendMessage}</p>
                        <p>Orders now submit to <code>place_order.php</code>. Login and signup submit to the PHP auth backend too.</p>
                    </div>
                </aside>
            </section>
        </div>
    )
}

export default function App() {
    const [page, setPage] = useState<PageName>(() => getPageFromPath(window.location.pathname))

    useEffect(() => {
        const onPopState = () => setPage(getPageFromPath(window.location.pathname))
        window.addEventListener('popstate', onPopState)
        return () => window.removeEventListener('popstate', onPopState)
    }, [])

    function navigate(path: string) {
        if (path.startsWith('#')) {
            document.querySelector(path)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            return
        }

        window.history.pushState({}, '', path)
        setPage(getPageFromPath(path))
    }

    if (page === 'signup') return <SignupPage navigate={navigate} />
    if (page === 'track') return <TrackOrderPage navigate={navigate} />
    if (page === 'cafe') return <CafePage navigate={navigate} />
    return <LoginPage navigate={navigate} />
}
