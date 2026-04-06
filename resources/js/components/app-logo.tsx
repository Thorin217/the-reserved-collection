export default function AppLogo() {
    return (
        <>
            {/* Monograma TRC */}
            <div className="flex aspect-square size-8 items-center justify-center rounded-sm border border-sidebar-primary/40 bg-sidebar-primary/10 shrink-0">
                <span className="text-xs font-semibold tracking-widest text-sidebar-primary" style={{ fontFamily: 'var(--font-serif)' }}>
                    TRC
                </span>
            </div>
            <div className="ml-2 grid flex-1 text-left leading-tight">
                <span className="truncate text-xs font-medium tracking-widest uppercase text-sidebar-primary/80">
                    The Reserved
                </span>
                <span className="truncate text-[10px] tracking-widest uppercase text-sidebar-foreground/50">
                    Collection
                </span>
            </div>
        </>
    );
}
