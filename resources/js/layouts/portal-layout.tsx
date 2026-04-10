import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Menu, Package, Search, ShoppingBag, User, X } from 'lucide-react';
import { useState } from 'react';
import { cart, catalog, home, wishlist } from '@/routes/portal';
import type { Auth } from '@/types';

type PortalCategory = { id: number; name: string; slug: string };

type Props = {
    children: React.ReactNode;
    wishlistCount?: number;
    cartCount?: number;
};

export default function PortalLayout({ children, wishlistCount = 0, cartCount = 0 }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { auth, portalCategories = [] } = usePage<{ auth: Auth; portalCategories: PortalCategory[] }>().props;
    const isAuth = !!auth?.user;

    const navLinks = [
        ...portalCategories.map((c) => ({
            label: c.name,
            href: catalog({ query: { category_slug: c.slug } }),
        })),
        { label: 'My Collection', href: isAuth ? wishlist() : '/login' },
    ];

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(catalog(), { search: searchQuery }, { preserveState: true });
        setSearchOpen(false);
        setSearchQuery('');
    }

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
                            powered by{' '}
                            <span className="text-gold/50 font-medium">KAZU</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-9">
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
                            onClick={() => setSearchOpen(!searchOpen)}
                            className="text-foreground/45 hover:text-gold transition-colors"
                            aria-label="Search"
                        >
                            <Search className="w-4 h-4" strokeWidth={1.5} />
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
                            <Link href="/settings/profile" className="hidden sm:block text-foreground/45 hover:text-gold transition-colors" aria-label="Profile">
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

                {/* Search bar */}
                <AnimatePresence>
                    {searchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border bg-background/98 overflow-hidden"
                        >
                            <form onSubmit={handleSearch} className="container mx-auto px-6 py-3 flex gap-3">
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search timepieces, jewelry, collectibles…"
                                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 border-b border-border focus:border-gold outline-none pb-1 tracking-wide transition-colors font-body"
                                />
                                <button type="submit" className="text-[9px] text-gold tracking-[0.2em] uppercase hover:text-gold-light transition-colors font-body">
                                    Search
                                </button>
                                <button type="button" onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                        <Link href="/settings/profile" className="text-foreground/55 hover:text-gold transition-colors text-xs font-body font-light tracking-[0.18em] uppercase flex items-center gap-2" onClick={() => setMobileOpen(false)}>
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

            {/* Page content */}
            <main className="pt-14 lg:pt-16">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-border mt-20">
                <div className="container mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <div className="flex flex-col mb-4">
                                <span className="font-display text-lg text-gold tracking-[0.12em]">THE RESERVED</span>
                                <span className="text-[9px] text-muted-foreground/50 tracking-[0.2em] uppercase font-body">Collection · powered by KAZU</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground/60 font-body font-light leading-relaxed max-w-xs">
                                Curated luxury timepieces, jewelry, and collectibles. Every piece authenticated and sourced with care.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-[10px] tracking-[0.25em] uppercase text-foreground/50 mb-3 font-body">Navigation</h4>
                            <div className="flex flex-col gap-2">
                                <Link href={home()} className="text-[11px] text-muted-foreground hover:text-gold transition-colors font-body">Home</Link>
                                <Link href={catalog()} className="text-[11px] text-muted-foreground hover:text-gold transition-colors font-body">All Catalog</Link>
                                {portalCategories.map((c) => (
                                    <Link key={c.id} href={catalog({ query: { category_slug: c.slug } })} className="text-[11px] text-muted-foreground hover:text-gold transition-colors font-body">
                                        {c.name}
                                    </Link>
                                ))}
                                {isAuth && (
                                    <>
                                        <Link href={wishlist()} className="text-[11px] text-muted-foreground hover:text-gold transition-colors font-body">My Wishlist</Link>
                                        <Link href={cart()} className="text-[11px] text-muted-foreground hover:text-gold transition-colors font-body">Cart</Link>
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] tracking-[0.25em] uppercase text-foreground/50 mb-3 font-body">Trust & Authenticity</h4>
                            <div className="flex flex-col gap-2">
                                {[
                                    'Authenticated by experts',
                                    'Serial number traceability',
                                    'Secure transactions',
                                    'Buyer protection guarantee',
                                ].map((item) => (
                                    <div key={item} className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-gold/60" />
                                        <span className="text-[11px] text-muted-foreground/70 font-body">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-[10px] text-muted-foreground/40 tracking-wider font-body">
                            © {new Date().getFullYear()} The Reserved Collection. All rights reserved.
                        </p>
                        <div className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-gold/40" strokeWidth={1.5} />
                            <span className="text-[9px] text-muted-foreground/30 tracking-[0.2em] uppercase font-body">Curated Luxury</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
