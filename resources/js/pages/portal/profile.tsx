import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock, Heart, LogOut, Package, Settings, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PortalLayout from '@/layouts/portal-layout';
import { cart, catalog, wishlist } from '@/routes/portal';
import type { Auth } from '@/types';

type Props = {
    auth: Auth;
    wishlistCount: number;
    cartCount: number;
};

const menuItems = [
    { icon: Package, label: 'My Orders', desc: 'Track purchases and deliveries', href: '#' },
    { icon: Heart, label: 'My Wishlist', desc: 'Your saved pieces', href: wishlist() },
    { icon: Clock, label: 'Order History', desc: 'Previous transactions', href: '#' },
    { icon: Settings, label: 'Account Settings', desc: 'Manage profile and security', href: '/settings/profile' },
];

export default function PortalProfile({ auth, wishlistCount, cartCount }: Props) {
    const user = auth?.user;

    if (!user) {
        return (
            <>
                <Head title="Profile — The Reserved Collection" />
                <div className="container mx-auto px-6 py-10 max-w-lg">
                    <div className="mb-8">
                        <p className="text-[9px] tracking-[0.3em] uppercase text-gold font-light mb-2">Account</p>
                        <h1 className="font-serif text-3xl font-light text-foreground">Profile</h1>
                    </div>

                    <div className="bg-card border border-border p-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-5 border border-border flex items-center justify-center">
                            <User className="w-7 h-7 text-muted-foreground" strokeWidth={1} />
                        </div>
                        <h2 className="font-serif text-xl font-light text-foreground mb-2">Welcome to The Reserved</h2>
                        <p className="text-[11px] text-muted-foreground font-light mb-8 max-w-xs mx-auto">
                            Sign in to access your collection, track orders, and manage your account.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
                    <h1 className="font-serif text-3xl font-light text-foreground">Profile</h1>
                </div>

                {/* Profile card */}
                <div className="bg-card border border-border p-6 mb-3 flex items-center gap-5">
                    <div className="w-14 h-14 border border-border flex items-center justify-center bg-secondary relative shrink-0">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-serif text-lg text-foreground truncate">{user.name}</h2>
                        <p className="text-[10px] text-muted-foreground tracking-wider truncate">{user.email}</p>
                        <div className="flex items-center gap-3 mt-2">
                            {user.email_verified_at ? (
                                <span className="flex items-center gap-1 text-[9px] text-green-500/80">
                                    <CheckCircle className="w-3 h-3" strokeWidth={1.5} /> Verified
                                </span>
                            ) : (
                                <Link href="/verify-email" className="flex items-center gap-1 text-[9px] text-gold hover:text-gold-light transition-colors">
                                    <AlertCircle className="w-3 h-3" strokeWidth={1.5} /> Verify Email
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
                            <h3 className="font-serif text-sm text-foreground">Two-Factor Authentication</h3>
                            <p className="text-[9px] text-muted-foreground">
                                {user.two_factor_enabled ? 'Enabled — your account is secured' : 'Add extra security to your account'}
                            </p>
                        </div>
                    </div>
                    <Link href="/settings/security" className="text-[9px] text-gold hover:text-gold-light tracking-wider transition-colors">
                        {user.two_factor_enabled ? 'Manage' : 'Enable'}
                    </Link>
                </div>

                {/* Stats: wishlist + cart */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <Link href={wishlist()} className="bg-card border border-border p-4 hover:border-gold/30 transition-all group">
                        <Heart className="w-5 h-5 text-muted-foreground group-hover:text-gold mb-2 transition-colors" strokeWidth={1.5} />
                        <p className="font-serif text-xl text-foreground">{wishlistCount}</p>
                        <p className="text-[10px] text-muted-foreground tracking-wider">Saved Pieces</p>
                    </Link>
                    <Link href={cart()} className="bg-card border border-border p-4 hover:border-gold/30 transition-all group">
                        <Package className="w-5 h-5 text-muted-foreground group-hover:text-gold mb-2 transition-colors" strokeWidth={1.5} />
                        <p className="font-serif text-xl text-foreground">{cartCount}</p>
                        <p className="text-[10px] text-muted-foreground tracking-wider">Cart Items</p>
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
                            <div className="w-9 h-9 border border-border group-hover:border-gold/30 flex items-center justify-center transition-colors">
                                <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-serif text-sm text-foreground">{item.label}</h3>
                                <p className="text-[9px] text-muted-foreground">{item.desc}</p>
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
                    className="w-full flex items-center justify-center gap-2 border border-border hover:border-destructive/30 text-muted-foreground hover:text-destructive py-3 text-[10px] tracking-[0.15em] uppercase transition-all"
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
