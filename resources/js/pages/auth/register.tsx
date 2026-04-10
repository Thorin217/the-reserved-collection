import { Form, Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Head title="Create Account — The Reserved Collection" />

            <AnimatePresence mode="wait">
                <motion.div
                    key="register"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Title */}
                    <div className="text-center mb-7">
                        <h1 className="font-display text-2xl font-light text-foreground mb-1">Create Account</h1>
                        <p className="text-[10px] text-muted-foreground font-body tracking-[0.15em] uppercase">Join the collection</p>
                    </div>

                    {/* Form */}
                    <Form
                        {...store.form()}
                        resetOnSuccess={['password', 'password_confirmation']}
                        disableWhileProcessing
                        className="space-y-3"
                    >
                        {({ processing, errors }) => (
                            <>
                                {/* Name */}
                                <div>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Full Name"
                                            required
                                            autoFocus
                                            autoComplete="name"
                                            maxLength={100}
                                            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border text-foreground text-xs font-body placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/40 transition-colors"
                                        />
                                    </div>
                                    <InputError message={errors.name} />
                                </div>

                                {/* Email */}
                                <div>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email Address"
                                            required
                                            autoComplete="email"
                                            maxLength={255}
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
                                            autoComplete="new-password"
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

                                {/* Confirm Password */}
                                <div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password_confirmation"
                                            placeholder="Confirm Password"
                                            required
                                            autoComplete="new-password"
                                            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border text-foreground text-xs font-body placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/40 transition-colors"
                                        />
                                    </div>
                                    <InputError message={errors.password_confirmation} />
                                </div>

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
                                            Create Account
                                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </Form>

                    {/* Terms */}
                    <p className="text-center mt-4 text-[8px] text-muted-foreground/60 font-body leading-relaxed">
                        By creating an account, you agree to our{' '}
                        <a href="#" className="text-gold/50 hover:text-gold/70 transition-colors">Terms of Service</a>{' '}and{' '}
                        <a href="#" className="text-gold/50 hover:text-gold/70 transition-colors">Privacy Policy</a>
                    </p>

                    {/* Toggle to login */}
                    <p className="text-center mt-5 text-[10px] text-muted-foreground font-body">
                        Already have an account?{' '}
                        <Link href={login()} className="text-gold hover:text-gold-light transition-colors">
                            Sign In
                        </Link>
                    </p>
                </motion.div>
            </AnimatePresence>
        </>
    );
}

Register.layout = {};
