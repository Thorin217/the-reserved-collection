import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Calendar, CheckCircle, Clock, Wrench, X } from 'lucide-react';
import { FlashMessage } from '@/components/flash-message';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as serviceRequestsIndex, show as serviceRequestsShow } from '@/routes/admin/service-requests';

type ServiceRequest = {
    id: number;
    service_type: string;
    service_type_label: string;
    status: string;
    status_label: string;
    scheduled_at: string;
    notes: string | null;
    created_at: string;
    user: { id: number; name: string; email: string } | null;
    sale_item: {
        id: number;
        description: string | null;
        product_variant: { product: { name: string; brand: { name: string } | null } | null } | null;
    } | null;
};

type Metrics = {
    scheduled_count: number;
    in_progress_count: number;
    completed_count: number;
};

type Props = {
    requests: { data: ServiceRequest[]; meta: { current_page: number; last_page: number } };
    metrics: Metrics;
    filters: { filter?: { status?: string; service_type?: string } };
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Calendar; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    scheduled: { label: 'Scheduled', icon: Calendar, variant: 'secondary' },
    in_progress: { label: 'In Progress', icon: Clock, variant: 'default' },
    completed: { label: 'Completed', icon: CheckCircle, variant: 'outline' },
    cancelled: { label: 'Cancelled', icon: X, variant: 'destructive' },
};

const ALL = '_all';

export default function ServiceRequestsIndex({ requests, metrics, filters }: Props) {
    const active = filters.filter ?? {};

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;
        router.get(serviceRequestsIndex(), { filter: { ...active, [key]: resolved } }, { preserveState: true, replace: true });
    }

    function itemName(req: ServiceRequest): string {
        return req.sale_item?.product_variant?.product?.name ?? req.sale_item?.description ?? '—';
    }

    return (
        <>
            <Head title="Service Requests" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Service Requests</h1>
                        <p className="text-sm text-muted-foreground">Manage client service requests for their collection items</p>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Scheduled</p>
                            <p className="text-2xl font-bold">{metrics.scheduled_count}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">In Progress</p>
                            <p className="text-2xl font-bold">{metrics.in_progress_count}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Completed</p>
                            <p className="text-2xl font-bold">{metrics.completed_count}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <Select value={active.status ?? ALL} onValueChange={(v) => applyFilter('status', v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All statuses</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={active.service_type ?? ALL} onValueChange={(v) => applyFilter('service_type', v)}>
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="All service types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All service types</SelectItem>
                            <SelectItem value="full_restoration">Full Restoration</SelectItem>
                            <SelectItem value="authentication_and_appraisal">Authentication & Appraisal</SelectItem>
                            <SelectItem value="preventive_care">Preventive Care</SelectItem>
                            <SelectItem value="crystal_polishing">Crystal Polishing</SelectItem>
                            <SelectItem value="pressure_testing">Pressure Testing</SelectItem>
                            <SelectItem value="custom_setting">Custom Setting</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Scheduled</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.data.map((req) => {
                                    const status = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.scheduled;
                                    const Icon = status.icon;
                                    return (
                                        <TableRow key={req.id}>
                                            <TableCell className="text-sm text-muted-foreground">#{req.id}</TableCell>
                                            <TableCell>
                                                <p className="font-medium">{req.user?.name ?? '—'}</p>
                                                <p className="text-xs text-muted-foreground">{req.user?.email ?? ''}</p>
                                            </TableCell>
                                            <TableCell className="max-w-[160px] truncate text-sm">
                                                {itemName(req)}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {req.service_type_label}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant} className="flex w-fit items-center gap-1">
                                                    <Icon className="h-3 w-3" />
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{req.scheduled_at}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link
                                                    href={serviceRequestsShow(req)}
                                                    className="flex items-center justify-end gap-1 text-sm text-muted-foreground hover:text-foreground"
                                                >
                                                    View <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {requests.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                            No service requests found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {requests.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={requests.meta.current_page}
                        lastPage={requests.meta.last_page}
                        onPageChange={(page) =>
                            router.get(serviceRequestsIndex(), { filter: active, page: String(page) }, { preserveState: true, replace: true })
                        }
                    />
                )}
            </div>
        </>
    );
}

ServiceRequestsIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[{ title: 'Service Requests', href: serviceRequestsIndex() }]}
    >
        {page}
    </AppLayout>
);
