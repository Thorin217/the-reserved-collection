import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
    currentPage: number;
    lastPage: number;
    onPageChange: (page: number) => void;
};

function buildPages(currentPage: number, lastPage: number): Array<number | 'ellipsis'> {
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const pages: Array<number | 'ellipsis'> = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(lastPage - 1, currentPage + 1);

    if (start > 2) {
        pages.push('ellipsis');
    }

    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }

    if (end < lastPage - 1) {
        pages.push('ellipsis');
    }

    pages.push(lastPage);

    return pages;
}

export default function TablePagination({ currentPage, lastPage, onPageChange }: Props) {
    if (lastPage <= 1) {
        return null;
    }

    const pages = buildPages(currentPage, lastPage);

    return (
        <div className="flex items-center justify-center gap-2">
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {pages.map((page, index) => {
                if (page === 'ellipsis') {
                    return (
                        <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                        </span>
                    );
                }

                return (
                    <Button
                        key={page}
                        type="button"
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </Button>
                );
            })}

            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= lastPage}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
