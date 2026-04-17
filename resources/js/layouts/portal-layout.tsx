import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Menu, Package, Search, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { auctionHouse, cart, catalog, home, myCollection, profile as portalProfile, wishlist } from '@/routes/portal';
import { index as ordersIndex } from '@/routes/portal/orders';
import type { Auth } from '@/types';

type PortalCategory = { id: number; name: string; slug: string };

type SearchResult = {
    id: number;
    name: string;
    slug: string;
    image_url: string;
    brand: string | null;
    category: string | null;
    price: string | null;
};

type SearchMeta = {
    total: number;
    current_page: number;
    last_page: number;
};

type Props = {
    children: React.ReactNode;
};

const footerLinks = {
    Collection: ['Timepieces', 'Fine Jewelry', 'New Arrivals', 'Estate Pieces', 'Exclusives'],
    Maisons: ['Rolex', 'Patek Philippe', 'Cartier', 'Omega', 'All Brands'],
    Services: ['Authentication', 'Restoration', 'Appraisal', 'Insurance', 'Concierge'],
    Company: ['About Us', 'Careers', 'Press', 'Contact'],
};

export default function PortalLayout({ children }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searchMeta, setSearchMeta] = useState<SearchMeta>({ total: 0, current_page: 1, last_page: 1 });
    const [searchLoading, setSearchLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    // Portal is always dark — force dark class on <html>, restore on unmount
    useEffect(() => {
        const html = document.documentElement;
        const wasDark = html.classList.contains('dark');
        html.classList.add('dark');
        html.style.colorScheme = 'dark';
        return () => {
            if (!wasDark) {
                html.classList.remove('dark');
                const stored = localStorage.getItem('appearance') || 'system';
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = stored === 'dark' || (stored === 'system' && prefersDark);
                html.style.colorScheme = isDark ? 'dark' : 'light';
            }
        };
    }, []);

    // Cmd+K shortcut + Escape to close
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                closeSearch();
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    // Debounced search fetch
    useEffect(() => {
        if (!searchOpen) return;
        const timer = setTimeout(() => fetchResults(searchQuery, 1), 300);
        return () => clearTimeout(timer);
    }, [searchQuery, searchOpen]);

    const { auth, portalCategories = [], cartCount = 0, wishlistCount = 0 } = usePage<{
        auth: Auth;
        portalCategories: PortalCategory[];
        cartCount: number;
        wishlistCount: number;
    }>().props;
    const isAuth = !!auth?.user;

    async function fetchResults(q: string, page: number) {
        if (q.length < 2) {
            setResults([]);
            setSearchMeta({ total: 0, current_page: 1, last_page: 1 });
            return;
        }
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setSearchLoading(true);
        try {
            const res = await fetch(`/search?q=${encodeURIComponent(q)}&page=${page}`, {
                signal: abortRef.current.signal,
            });
            if (!res.ok) return;
            const json = await res.json();
            setResults(json.data);
            setSearchMeta(json.meta);
        } catch (err) {
            if ((err as Error).name !== 'AbortError') console.error(err);
        } finally {
            setSearchLoading(false);
        }
    }

    function closeSearch() {
        setSearchOpen(false);
        setSearchQuery('');
        setResults([]);
        setSearchMeta({ total: 0, current_page: 1, last_page: 1 });
    }

    function viewAllResults() {
        router.get(catalog(), { search: searchQuery });
        closeSearch();
    }

    const navLinks = [
        ...portalCategories.map((c) => ({
            label: c.name,
            href: catalog({ query: { category_slug: c.slug } }),
        })),
        { label: 'Auctions', href: auctionHouse() },
        { label: 'My Collection', href: isAuth ? myCollection() : '/login' },
        { label: 'My Orders', href: isAuth ? ordersIndex() : '/login' },
        { label: 'Services', href: catalog() },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
                <div className="container mx-auto px-6 flex items-center justify-between h-14 lg:h-16">
                    {/* Logo */}
                    <Link href={home()} className="flex flex-col items-start leading-none">
                        <div className="flex items-baseline gap-2">
                            <span className="font-display text-lg lg:text-xl font-semibold text-gold tracking-[0.12em]">
                                THE RESERVED
                            </span>
                            <span className="text-[10px] lg:text-[11px] text-foreground/35 tracking-[0.2em] uppercase font-body font-light">
                                Collection
                            </span>
                        </div>
                        <span className="text-[7px] text-muted-foreground/40 tracking-[0.25em] uppercase font-body font-light">
                            powered by <span className="text-gold/50 font-medium">KAZU</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-[10px] font-body font-light text-foreground/55 hover:text-gold transition-colors tracking-[0.18em] uppercase"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Search toggle */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="flex items-center gap-1.5 text-foreground/45 hover:text-gold transition-colors"
                            aria-label="Search"
                        >
                            <Search className="w-4 h-4" strokeWidth={1.5} />
                            <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[7px] text-foreground/20 font-body border border-border/50 px-1 py-0.5 tracking-wide">
                                ⌘K
                            </kbd>
                        </button>

                        {/* Wishlist */}
                        {isAuth && (
                            <Link href={wishlist()} className="hidden sm:block text-foreground/45 hover:text-gold transition-colors relative" aria-label="Wishlist">
                                <Heart className="w-4 h-4" strokeWidth={1.5} />
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gold text-primary-foreground text-[7px] font-body font-bold flex items-center justify-center rounded-full">
                                        {wishlistCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Cart */}
                        {isAuth && (
                            <Link href={cart()} className="hidden sm:block text-foreground/45 hover:text-gold transition-colors relative" aria-label="Cart">
                                <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gold text-primary-foreground text-[7px] font-body font-bold flex items-center justify-center rounded-full">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Profile / Auth */}
                        {isAuth ? (
                            <Link href={portalProfile()} className="hidden sm:block text-foreground/45 hover:text-gold transition-colors" aria-label="Profile">
                                <User className="w-4 h-4" strokeWidth={1.5} />
                            </Link>
                        ) : (
                            <Link href="/login" className="hidden sm:flex items-center gap-1 text-[9px] text-gold tracking-[0.18em] uppercase hover:text-gold-light transition-colors">
                                Sign In
                            </Link>
                        )}

                        {/* Mobile menu */}
                        <button
                            className="lg:hidden text-foreground/55"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Menu"
                        >
                            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="lg:hidden bg-background border-t border-border overflow-hidden"
                        >
                            <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className="text-foreground/55 hover:text-gold transition-colors text-xs font-body font-light tracking-[0.18em] uppercase"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                {isAuth && (
                                    <div className="border-t border-border pt-4 flex flex-col gap-4">
                                        <Link href={wishlist()} className="text-foreground/55 hover:text-gold transition-colors text-xs font-body font-light tracking-[0.18em] uppercase flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                                            <Heart className="w-3.5 h-3.5" strokeWidth={1.5} /> Wishlist
                                            {wishlistCount > 0 && <span className="text-gold">({wishlistCount})</span>}
                                        </Link>
                                        <Link href={cart()} className="text-foreground/55 hover:text-gold transition-colors text-xs font-body font-light tracking-[0.18em] uppercase flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                                            <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.5} /> Cart
                                            {cartCount > 0 && <span className="text-gold">({cartCount})</span>}
                                        </Link>
                                        <Link href={portalProfile()} className="text-foreground/55 hover:text-gold transition-colors text-xs font-body font-light tracking-[0.18em] uppercase flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                                            <User className="w-3.5 h-3.5" strokeWidth={1.5} /> Profile
                                        </Link>
                                    </div>
                                )}
                                {!isAuth && (
                                    <div className="border-t border-border pt-4">
                                        <Link href="/login" className="text-gold text-xs font-body tracking-[0.18em] uppercase" onClick={() => setMobileOpen(false)}>
                                            Sign In
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Command Palette */}
            <AnimatePresence>
                {searchOpen && (
                    <motion.div
                        key="command-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4 bg-background/80 backdrop-blur-md"
                        onClick={closeSearch}
                    >
                        <motion.div
                            key="command-panel"
                            initial={{ opacity: 0, y: -12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.98 }}
                            transition={{ duration: 0.18 }}
                            className="w-full max-w-2xl bg-card border border-border shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Search input */}
                            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                                <Search className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchQuery.length >= 2) {
                                            viewAllResults();
                                        }
                                    }}
                                    placeholder="Search timepieces, jewelry, brands, references…"
                                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none tracking-wide font-body"
                                />
                                <div className="flex items-center gap-2 shrink-0">
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <kbd className="hidden sm:inline-flex items-center text-[8px] text-muted-foreground/40 font-body border border-border px-1.5 py-0.5 tracking-wider">
                                        ESC
                                    </kbd>
                                </div>
                            </div>

                            {/* Results area */}
                            <div className="max-h-[55vh] overflow-y-auto">
                                {/* Loading skeleton */}
                                {searchLoading && (
                                    <div className="divide-y divide-border">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="flex items-center gap-3 px-4 py-3">
                                                <div className="w-11 h-11 shrink-0 bg-secondary animate-pulse" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-2 bg-secondary animate-pulse w-14 rounded-sm" />
                                                    <div className="h-3 bg-secondary animate-pulse w-48 rounded-sm" />
                                                </div>
                                                <div className="h-3 bg-secondary animate-pulse w-16 rounded-sm" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Empty prompt */}
                                {!searchLoading && searchQuery.length < 2 && (
                                    <div className="py-14 text-center">
                                        <Search className="w-8 h-8 text-muted-foreground/15 mx-auto mb-3" strokeWidth={1} />
                                        <p className="text-[10px] text-muted-foreground/50 font-body tracking-[0.2em] uppercase">
                                            Type at least 2 characters to search
                                        </p>
                                    </div>
                                )}

                                {/* No results */}
                                {!searchLoading && searchQuery.length >= 2 && results.length === 0 && (
                                    <div className="py-14 text-center">
                                        <p className="text-sm text-muted-foreground font-body">
                                            No results for <span className="text-foreground">"{searchQuery}"</span>
                                        </p>
                                        <p className="mt-1 text-[10px] text-muted-foreground/50 font-body">
                                            Try a brand name, product name, or reference number
                                        </p>
                                    </div>
                                )}

                                {/* Results list */}
                                {!searchLoading && results.length > 0 && (
                                    <div className="divide-y divide-border">
                                        {results.map((product) => (
                                            <Link
                                                key={product.id}
                                                href={`/products/${product.slug}`}
                                                onClick={closeSearch}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors group"
                                            >
                                                {/* Thumbnail */}
                                                <div className="w-11 h-11 shrink-0 bg-secondary overflow-hidden border border-border">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-4 h-4 text-muted-foreground/20" strokeWidth={1} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    {product.brand && (
                                                        <p className="text-[8px] text-muted-foreground tracking-[0.2em] uppercase font-body mb-0.5">
                                                            {product.brand}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-foreground group-hover:text-gold truncate font-body transition-colors leading-tight">
                                                        {product.name}
                                                    </p>
                                                    {product.category && (
                                                        <p className="text-[8px] text-muted-foreground/50 font-body mt-0.5">
                                                            {product.category}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Price */}
                                                <div className="shrink-0 text-right">
                                                    {product.price ? (
                                                        <p className="text-sm text-gold font-body font-semibold">
                                                            {formatCurrency(product.price)}
                                                        </p>
                                                    ) : (
                                                        <p className="text-[9px] text-muted-foreground/60 font-body tracking-wider">
                                                            On request
                                                        </p>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pagination + footer */}
                            {!searchLoading && results.length > 0 && (
                                <div className="border-t border-border px-4 py-2.5 flex items-center justify-between gap-4 bg-secondary/20">
                                    {/* Pagination */}
                                    <div className="flex items-center gap-3">
                                        {searchMeta.last_page > 1 && (
                                            <>
                                                <button
                                                    disabled={searchMeta.current_page <= 1}
                                                    onClick={() => fetchResults(searchQuery, searchMeta.current_page - 1)}
                                                    className="text-[9px] text-muted-foreground hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed tracking-wider uppercase font-body transition-colors"
                                                >
                                                    ← Prev
                                                </button>
                                                <span className="text-[9px] text-muted-foreground/50 font-body">
                                                    {searchMeta.current_page} / {searchMeta.last_page}
                                                </span>
                                                <button
                                                    disabled={searchMeta.current_page >= searchMeta.last_page}
                                                    onClick={() => fetchResults(searchQuery, searchMeta.current_page + 1)}
                                                    className="text-[9px] text-muted-foreground hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed tracking-wider uppercase font-body transition-colors"
                                                >
                                                    Next →
                                                </button>
                                            </>
                                        )}
                                        <span className="text-[9px] text-muted-foreground/40 font-body">
                                            {searchMeta.total} result{searchMeta.total !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {/* View all */}
                                    <button
                                        onClick={viewAllResults}
                                        className="text-[9px] text-gold hover:text-gold-light tracking-[0.15em] uppercase font-body transition-colors whitespace-nowrap"
                                    >
                                        View all in catalog →
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Page content */}
            <main className="pt-14 lg:pt-16">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-card border-t border-border">
                <div className="container mx-auto px-6 py-16">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
                        <div className="col-span-2 md:col-span-1">
                            <div className="mb-5">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="font-display text-lg font-semibold text-gold tracking-[0.12em]">THE RESERVED</span>
                                    <span className="text-[10px] text-foreground/35 tracking-[0.2em] uppercase font-body font-light">Collection</span>
                                </div>
                                <p className="text-[7px] text-muted-foreground/40 tracking-[0.25em] uppercase font-body font-light mt-0.5">
                                    powered by <span className="text-gold/50 font-medium">KAZU</span>
                                </p>
                            </div>
                            <p className="text-muted-foreground text-[11px] font-body font-light leading-relaxed">
                                The definitive destination for authenticated luxury timepieces and fine jewelry since 2024.
                            </p>
                        </div>
                        {Object.entries(footerLinks).map(([title, links]) => (
                            <div key={title}>
                                <h4 className="font-body font-medium text-foreground/50 text-[9px] uppercase tracking-[0.25em] mb-4">{title}</h4>
                                <ul className="space-y-2.5">
                                    {links.map((link) => (
                                        <li key={link}>
                                            <a href="#" className="text-muted-foreground hover:text-gold text-[11px] font-body font-light transition-colors">
                                                {link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-border mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-muted-foreground/60 text-[10px] font-body font-light">© {new Date().getFullYear()} The Reserved Collection. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="text-muted-foreground/60 hover:text-gold text-[10px] font-body font-light transition-colors">Privacy</a>
                            <a href="#" className="text-muted-foreground/60 hover:text-gold text-[10px] font-body font-light transition-colors">Terms</a>
                            <a href="#" className="text-muted-foreground/60 hover:text-gold text-[10px] font-body font-light transition-colors">Cookies</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
