import { Form, Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, Wallet } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

const socialProviders = [
    {
        id: 'google', label: 'Google', icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
        ),
    },
    {
        id: 'apple', label: 'Apple', icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
        ),
    },
    {
        id: 'facebook', label: 'Facebook', icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
    },
    {
        id: 'twitter', label: 'X', icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
];

export default function Login({ status, canResetPassword, canRegister }: Props) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Head title="Sign In — The Reserved Collection" />

            <AnimatePresence mode="wait">
                <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Title */}
                    <div className="text-center mb-7">
                        <h1 className="font-display text-2xl font-light text-foreground mb-1">Welcome Back</h1>
                        <p className="text-[10px] text-muted-foreground font-body tracking-[0.15em] uppercase">Sign in to your account</p>
                    </div>

                    {/* Status message */}
                    {status && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                            <p className="text-[10px] text-green-500 font-body">{status}</p>
                        </div>
                    )}

                    {/* Social providers */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {socialProviders.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                disabled
                                className="flex items-center justify-center gap-2 py-2.5 bg-card border border-border hover:border-gold/25 transition-all text-foreground/70 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Coming soon"
                            >
                                {p.icon}
                                <span className="text-[9px] font-body tracking-[0.1em] uppercase">{p.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Wallet sign-in */}
                    <button
                        type="button"
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-2.5 mb-5 bg-card border border-border hover:border-gold/25 transition-all text-foreground/70 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Coming soon"
                    >
                        <Wallet className="w-4 h-4" strokeWidth={1.5} />
                        <span className="text-[9px] font-body tracking-[0.1em] uppercase">Sign in with Wallet</span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-5">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[8px] text-muted-foreground font-body tracking-[0.2em] uppercase">or continue with email</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Form */}
                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="space-y-3"
                    >
                        {({ processing, errors }) => (
                            <>
                                {/* Email */}
                                <div>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email Address"
                                            required
                                            autoFocus
                                            autoComplete="email"
                                            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border text-foreground text-xs font-body placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/40 transition-colors"
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                                {/* Password */}
                                <div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            placeholder="Password"
                                            required
                                            autoComplete="current-password"
                                            className="w-full pl-9 pr-10 py-2.5 bg-card border border-border text-foreground text-xs font-body placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/40 transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword
                                                ? <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                : <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                                            }
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                {/* Forgot password */}
                                {canResetPassword && (
                                    <div className="text-right">
                                        <Link
                                            href={request()}
                                            className="text-[9px] text-gold/70 hover:text-gold font-body tracking-wider transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                )}

                                {/* General errors */}
                                {errors.email && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                                        <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" strokeWidth={1.5} />
                                        <p className="text-[10px] text-destructive font-body">These credentials do not match our records.</p>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-gold text-primary-foreground text-[10px] font-body font-medium tracking-[0.18em] uppercase hover:bg-gold-light transition-all disabled:opacity-50 group mt-2"
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <>
                                            Sign In
                                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </Form>

                    {/* Toggle to register */}
                    {canRegister && (
                        <p className="text-center mt-6 text-[10px] text-muted-foreground font-body">
                            Don't have an account?{' '}
                            <Link href={register()} className="text-gold hover:text-gold-light transition-colors">
                                Sign Up
                            </Link>
                        </p>
                    )}
                </motion.div>
            </AnimatePresence>
        </>
    );
}

Login.layout = {};
