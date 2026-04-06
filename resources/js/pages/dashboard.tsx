import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Package, Tag, FolderOpen, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { create as createProduct, index as productsIndex } from '@/routes/admin/products';
import { index as brandsIndex } from '@/routes/admin/brands';
import { index as categoriesIndex } from '@/routes/admin/categories';
import { dashboard } from '@/routes';

type Props = {
    stats: {
        products: number;
        active_products: number;
        brands: number;
        categories: number;
        serials_available: number;
        serials_total: number;
    };
    recent_products: Array<{
        id: number;
        name: string;
        sku: string;
        status: string;
        brand: { name: string } | null;
    }>;
};

const STATUS_COLORS: Record<string, string> = {
    active: 'text-emerald-400',
    draft: 'text-yellow-500/70',
    inactive: 'text-muted-foreground',
};

const STATUS_LABELS: Record<string, string> = {
    active: 'Activo',
    draft: 'Borrador',
    inactive: 'Inactivo',
};

export default function Dashboard({ stats, recent_products }: Props) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Panel administrativo</p>
                        <h1 className="text-3xl font-light" style={{ fontFamily: 'var(--font-serif)' }}>
                            The Reserved Collection
                        </h1>
                    </div>
                    <Link
                        href={createProduct()}
                        className="flex items-center gap-2 rounded-sm border border-primary/40 bg-primary/10 px-4 py-2 text-xs tracking-widest uppercase text-primary transition-colors hover:bg-primary/20"
                    >
                        Nuevo producto
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>

                {/* Separador ornamental */}
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border" />
                    <div className="h-1 w-1 rounded-full bg-primary/60" />
                    <div className="h-px w-8 bg-primary/60" />
                    <div className="h-1 w-1 rounded-full bg-primary/60" />
                    <div className="h-px flex-1 bg-border" />
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-border/60 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs tracking-widest uppercase text-muted-foreground font-normal">
                                Productos
                            </CardTitle>
                            <Package className="h-4 w-4 text-primary/60" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-light text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
                                {stats?.products ?? 0}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {stats?.active_products ?? 0} activos
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs tracking-widest uppercase text-muted-foreground font-normal">
                                Seriales
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary/60" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-light text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
                                {stats?.serials_available ?? 0}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                disponibles de {stats?.serials_total ?? 0}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs tracking-widest uppercase text-muted-foreground font-normal">
                                Marcas
                            </CardTitle>
                            <Tag className="h-4 w-4 text-primary/60" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-light text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
                                {stats?.brands ?? 0}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">registradas</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs tracking-widest uppercase text-muted-foreground font-normal">
                                Categorías
                            </CardTitle>
                            <FolderOpen className="h-4 w-4 text-primary/60" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-light text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
                                {stats?.categories ?? 0}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">registradas</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Productos recientes */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card className="border-border/60 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm tracking-widest uppercase font-normal text-muted-foreground">
                                    Productos recientes
                                </CardTitle>
                                <Link href={productsIndex()} className="text-xs text-primary/70 hover:text-primary transition-colors">
                                    Ver todos →
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0">
                                {(!recent_products || recent_products.length === 0) ? (
                                    <div className="px-6 py-8 text-center">
                                        <p className="text-sm text-muted-foreground">No hay productos registrados aún.</p>
                                        <Link href={createProduct()} className="mt-2 inline-block text-xs text-primary underline">
                                            Crear primer producto
                                        </Link>
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y divide-border/50">
                                            {recent_products.map(product => (
                                                <tr key={product.id} className="group hover:bg-muted/20 transition-colors">
                                                    <td className="px-6 py-3">
                                                        <p className="font-medium text-foreground">{product.name}</p>
                                                        <p className="text-xs font-mono text-muted-foreground">{product.sku}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {product.brand?.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`text-xs ${STATUS_COLORS[product.status] ?? 'text-muted-foreground'}`}>
                                                            {STATUS_LABELS[product.status] ?? product.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Accesos rápidos */}
                    <div className="space-y-3">
                        <p className="text-xs tracking-widest uppercase text-muted-foreground px-1">Accesos rápidos</p>
                        {[
                            { label: 'Gestionar productos', href: productsIndex(), icon: Package },
                            { label: 'Gestionar marcas', href: brandsIndex(), icon: Tag },
                            { label: 'Gestionar categorías', href: categoriesIndex(), icon: FolderOpen },
                        ].map(({ label, href, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center gap-3 rounded-sm border border-border/50 bg-card px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                            >
                                <Icon className="h-4 w-4 text-primary/60" />
                                <span>{label}</span>
                                <ArrowRight className="ml-auto h-3 w-3 opacity-40" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }]}>
        {page}
    </AppLayout>
);
