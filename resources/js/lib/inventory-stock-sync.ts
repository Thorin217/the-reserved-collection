const INVENTORY_STOCK_SYNC_KEY = 'inventory:stock:updated_at';
const INVENTORY_STOCK_SYNC_EVENT = 'inventory-stock-updated';

type Callback = () => void;

export function notifyInventoryStockChanged(): void {
    if (typeof window === 'undefined') {
        return;
    }

    const timestamp = Date.now().toString();

    window.localStorage.setItem(INVENTORY_STOCK_SYNC_KEY, timestamp);
    window.dispatchEvent(new CustomEvent(INVENTORY_STOCK_SYNC_EVENT, { detail: timestamp }));
}

export function subscribeInventoryStockChanges(callback: Callback): () => void {
    if (typeof window === 'undefined') {
        return () => {};
    }

    const onStorage = (event: StorageEvent) => {
        if (event.key === INVENTORY_STOCK_SYNC_KEY) {
            callback();
        }
    };

    const onCustomEvent = () => {
        callback();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(INVENTORY_STOCK_SYNC_EVENT, onCustomEvent);

    return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(INVENTORY_STOCK_SYNC_EVENT, onCustomEvent);
    };
}
