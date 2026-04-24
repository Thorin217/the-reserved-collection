import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Gavel,
    CheckCircle,
    Clock,
    CreditCard,
    Heart,
    LogOut,
    Package,
    Pencil,
    Plus,
    Shield,
    Star,
    Trash2,
    User,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import PortalLayout from '@/layouts/portal-layout';
import { cart, catalog, myCollection, wishlist } from '@/routes/portal';
import { index as ordersIndex } from '@/routes/portal/orders';
import { auctions as profileAuctions } from '@/routes/portal/profile';
import type { Auth } from '@/types';

type PaymentMethod = {
    id: string;
    type: 'card' | 'apple_pay' | 'google_pay';
    brand?: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
};

const menuItems = [
    { icon: Package, label: 'My Orders', desc: 'Track purchases and deliveries', href: ordersIndex() },
    { icon: Gavel, label: 'My Auctions', desc: 'Review bids, wins and closed results', href: profileAuctions() },
    { icon: Heart, label: 'My Wishlist', desc: 'Your saved pieces', href: wishlist() },
    { icon: Clock, label: 'My Collection', desc: 'Track your portfolio value', href: myCollection() },
];

function cardBrandIcon(brand?: string) {
    switch (brand?.toLowerCase()) {
        case 'visa': return '💳';
        case 'mastercard': return '💳';
        case 'apple pay': return '🍎';
        case 'google pay': return '📱';
        default: return '💳';
    }
}

function generateDummyCard(type: 'card' | 'apple_pay' | 'google_pay', isFirst: boolean): PaymentMethod {
    if (type === 'card') {
        return {
            id: `pm-${Date.now()}`,
            type,
            brand: 'Visa',
            last4: String(Math.floor(1000 + Math.random() * 9000)),
            expiryMonth: Math.floor(1 + Math.random() * 12),
            expiryYear: 2027 + Math.floor(Math.random() * 4),
            isDefault: isFirst,
        };
    }
    if (type === 'apple_pay') {
        return { id: `pm-${Date.now()}`, type, brand: 'Apple Pay', isDefault: isFirst };
    }
    return { id: `pm-${Date.now()}`, type, brand: 'Google Pay', isDefault: isFirst };
}

function PaymentMethodRow({ method, onSetDefault, onRemove }: { method: PaymentMethod; onSetDefault: () => void; onRemove: () => void }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-secondary/50 border border-border">
            <span className="text-sm">{cardBrandIcon(method.brand)}</span>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-foreground font-body">{method.brand}</span>
                    {method.last4 && <span className="text-[9px] text-muted-foreground font-body">•••• {method.last4}</span>}
                    {method.isDefault && (
                        <span className="text-[7px] text-gold font-body tracking-wider uppercase bg-gold/10 px-1.5 py-0.5">Default</span>
                    )}
                </div>
                {method.expiryMonth && method.expiryYear && (
                    <span className="text-[8px] text-muted-foreground/60 font-body">
                        Expires {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-1">
                {!method.isDefault && (
                    <button onClick={onSetDefault} className="p-1.5 text-muted-foreground hover:text-gold transition-colors" title="Set as default">
                        <Star className="w-3 h-3" strokeWidth={1.5} />
                    </button>
                )}
                <button onClick={onRemove} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Remove">
                    <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
}

export default function PortalProfile() {
    const { auth, cartCount = 0, wishlistCount = 0, auctionParticipationCount = 0 } = usePage<{
        auth: Auth;
        cartCount: number;
        wishlistCount: number;
        auctionParticipationCount: number;
    }>().props;
    const user = auth?.user;
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    function addPaymentMethod(type: 'card' | 'apple_pay' | 'google_pay') {
        setPaymentMethods((prev) => {
            const method = generateDummyCard(type, prev.length === 0);
            return [...prev, method];
        });
        setShowAddPayment(false);
    }

    function removePaymentMethod(id: string) {
        setPaymentMethods((prev) => {
            const filtered = prev.filter((m) => m.id !== id);
            if (filtered.length > 0 && !filtered.some((m) => m.isDefault)) {
                filtered[0].isDefault = true;
            }
            return filtered;
        });
    }

    function setDefaultPaymentMethod(id: string) {
        setPaymentMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
    }

    if (!user) {
        return (
            <>
                <Head title="Profile — The Reserved Collection" />
                <div className="container mx-auto px-6 py-10 max-w-lg">
                    <div className="mb-8">
                        <p className="text-[9px] tracking-[0.3em] uppercase text-gold font-light mb-2">Account</p>
                        <h1 className="font-display text-3xl font-light text-foreground">Profile</h1>
                    </div>

                    <div className="bg-card border border-border p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary border border-border flex items-center justify-center">
                            <User className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <h2 className="font-display text-lg text-foreground mb-1">Welcome to The Reserved</h2>
                        <p className="text-[10px] text-muted-foreground font-body mb-6">Sign in to access your collection, participate in auctions, and manage your account.</p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button asChild className="bg-gold hover:bg-gold-dark text-primary-foreground text-[10px] tracking-[0.2em] uppercase rounded-none h-10 px-8">
                                <Link href="/login">Sign In</Link>
                            </Button>
                            <Button asChild variant="outline" className="text-[10px] tracking-[0.2em] uppercase rounded-none h-10 px-8">
                                <Link href="/register">Create Account</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Profile — The Reserved Collection" />

            <div className="container mx-auto px-6 py-10 max-w-lg">
                <div className="mb-8">
                    <p className="text-[9px] tracking-[0.3em] uppercase text-gold font-light mb-2">Account</p>
                    <h1 className="font-display text-3xl font-light text-foreground">Profile</h1>
                </div>

                {/* Profile card */}
                <div className="bg-card border border-border p-6 mb-3 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center relative shrink-0">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                        )}
                        <button className="absolute -bottom-1 -right-1 w-5 h-5 bg-card border border-border rounded-full flex items-center justify-center hover:border-gold/30 transition-colors">
                            <Pencil className="w-2.5 h-2.5 text-muted-foreground" strokeWidth={1.5} />
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-display text-lg text-foreground truncate">{user.name}</h2>
                        <p className="text-[10px] text-muted-foreground font-body tracking-wider truncate">{user.email}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                            {user.email_verified_at ? (
                                <span className="flex items-center gap-1 text-[8px] text-green-500/80 font-body">
                                    <CheckCircle className="w-2.5 h-2.5" /> Verified
                                </span>
                            ) : (
                                <Link href="/verify-email" className="flex items-center gap-1 text-[8px] text-gold font-body hover:text-gold-light transition-colors">
                                    <AlertCircle className="w-2.5 h-2.5" /> Verify Email
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="bg-card border border-border p-4 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        <div>
                            <h3 className="font-display text-sm text-foreground">Two-Factor Authentication</h3>
                            <p className="text-[9px] text-muted-foreground font-body">
                                {user.two_factor_enabled ? 'Enabled — your account is secured' : 'Add extra security to your account'}
                            </p>
                        </div>
                    </div>
                    <Link href="/settings/security" className="text-[9px] text-gold hover:text-gold-light tracking-wider transition-colors font-body">
                        {user.two_factor_enabled ? 'Manage' : 'Enable'}
                    </Link>
                </div>

                {/* Payment Methods */}
                <div className="bg-card border border-border p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                            <h3 className="font-display text-sm text-foreground">Payment Methods</h3>
                        </div>
                        <button
                            onClick={() => setShowAddPayment(!showAddPayment)}
                            className="flex items-center gap-1 text-[9px] text-gold font-body tracking-wider hover:text-gold-light transition-colors"
                        >
                            <Plus className="w-3 h-3" strokeWidth={1.5} /> Add
                        </button>
                    </div>

                    <AnimatePresence>
                        {showAddPayment && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-3 overflow-hidden"
                            >
                                <div className="grid grid-cols-3 gap-2 pb-3 border-b border-border">
                                    {([
                                        { type: 'card' as const, label: 'Credit/Debit Card', icon: '💳' },
                                        { type: 'apple_pay' as const, label: 'Apple Pay', icon: '🍎' },
                                        { type: 'google_pay' as const, label: 'Google Pay', icon: '📱' },
                                    ]).map((opt) => (
                                        <button
                                            key={opt.type}
                                            onClick={() => addPaymentMethod(opt.type)}
                                            className="flex flex-col items-center gap-1.5 py-3 bg-secondary border border-border hover:border-gold/25 transition-all"
                                        >
                                            <span className="text-base">{opt.icon}</span>
                                            <span className="text-[8px] text-muted-foreground font-body tracking-wider">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {paymentMethods.length === 0 ? (
                        <p className="text-[9px] text-muted-foreground/60 font-body text-center py-3">
                            No payment methods added. Add one to participate in auctions.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {paymentMethods.map((pm) => (
                                <PaymentMethodRow
                                    key={pm.id}
                                    method={pm}
                                    onSetDefault={() => setDefaultPaymentMethod(pm.id)}
                                    onRemove={() => removePaymentMethod(pm.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Wallet link (if applicable) */}
                <div className="bg-card border border-border p-4 mb-3 flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    <div className="flex-1">
                        <h3 className="font-display text-sm text-foreground">Connected Wallet</h3>
                        <p className="text-[9px] text-muted-foreground font-body">No wallet connected</p>
                    </div>
                    <button className="text-[9px] text-gold font-body tracking-wider hover:text-gold-light transition-colors">
                        Connect
                    </button>
                </div>

                {/* Stats: wishlist + cart */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                    <Link href={wishlist()} className="bg-card border border-border p-4 hover:border-gold/30 transition-all group">
                        <Heart className="w-5 h-5 text-muted-foreground group-hover:text-gold mb-2 transition-colors" strokeWidth={1.5} />
                        <p className="font-display text-xl text-foreground">{wishlistCount}</p>
                        <p className="text-[10px] text-muted-foreground tracking-wider font-body">Saved Pieces</p>
                    </Link>
                    <Link href={profileAuctions()} className="bg-card border border-border p-4 hover:border-gold/30 transition-all group">
                        <Gavel className="w-5 h-5 text-muted-foreground group-hover:text-gold mb-2 transition-colors" strokeWidth={1.5} />
                        <p className="font-display text-xl text-foreground">{auctionParticipationCount}</p>
                        <p className="text-[10px] text-muted-foreground tracking-wider font-body">Auction Entries</p>
                    </Link>
                    <Link href={cart()} className="bg-card border border-border p-4 hover:border-gold/30 transition-all group">
                        <Package className="w-5 h-5 text-muted-foreground group-hover:text-gold mb-2 transition-colors" strokeWidth={1.5} />
                        <p className="font-display text-xl text-foreground">{cartCount}</p>
                        <p className="text-[10px] text-muted-foreground tracking-wider font-body">Cart Items</p>
                    </Link>
                </div>

                {/* Menu items */}
                <div className="space-y-2 mb-6">
                    {menuItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center gap-4 p-4 bg-card border border-border hover:border-gold/25 transition-all group"
                        >
                            <div className="w-10 h-10 border border-border group-hover:border-gold/30 flex items-center justify-center transition-colors">
                                <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-display text-sm text-foreground">{item.label}</h3>
                                <p className="text-[9px] text-muted-foreground font-body">{item.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Browse link */}
                <div className="mb-4">
                    <Button asChild className="w-full bg-gold hover:bg-gold-dark text-primary-foreground text-[10px] tracking-[0.2em] uppercase h-10 rounded-none">
                        <Link href={catalog()}>Browse Collection</Link>
                    </Button>
                </div>

                {/* Sign Out */}
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="w-full flex items-center justify-center gap-2 border border-border hover:border-destructive/30 text-muted-foreground hover:text-destructive py-3 text-[10px] tracking-[0.15em] uppercase transition-all font-body"
                >
                    <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Sign Out
                </Link>
            </div>
        </>
    );
}

PortalProfile.layout = (page: React.ReactNode) => (
    <PortalLayout>{page}</PortalLayout>
);
