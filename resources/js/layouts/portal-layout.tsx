import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auctionHouse, cart, catalog, home, myCollection, wishlist } from '@/routes/portal';
import { edit as profileSettings } from '@/routes/profile';
import type { Auth } from '@/types';

type PortalCategory = { id: number; name: string; slug: string };

type Props = {
    children: React.ReactNode;
    wishlistCount?: number;
    cartCount?: number;
};

const footerLinks = {
    Collection: ['Timepieces', 'Fine Jewelry', 'New Arrivals', 'Estate Pieces', 'Exclusives'],
    Maisons: ['Rolex', 'Patek Philippe', 'Cartier', 'Omega', 'All Brands'],
    Services: ['Authentication', 'Restoration', 'Appraisal', 'Insurance', 'Concierge'],
    Company: ['About Us', 'Careers', 'Press', 'Contact'],
};

export default function PortalLayout({ children, wishlistCount = 0, cartCount = 0 }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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
    const { auth, portalCategories = [] } = usePage<{ auth: Auth; portalCategories: PortalCategory[] }>().props;
    const isAuth = !!auth?.user;

    const navLinks = [
        ...portalCategories.map((c) => ({
            label: c.name,
            href: catalog({ query: { category_slug: c.slug } }),
        })),
        { label: 'Auctions', href: auctionHouse() },
        { label: 'My Collection', href: isAuth ? myCollection() : '/login' },
        { label: 'Services', href: catalog() },
    ];

    function handleSearch(e: React.FormEvent<HTMLFormElement>) {
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
                            <Link href={profileSettings()} className="hidden sm:block text-foreground/45 hover:text-gold transition-colors" aria-label="Profile">
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
                                        <Link href={profileSettings()} className="text-foreground/55 hover:text-gold transition-colors text-xs font-body font-light tracking-[0.18em] uppercase flex items-center gap-2" onClick={() => setMobileOpen(false)}>
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
