# Arquitectura Técnica

---

## Estructura de Directorios Clave

```
the-reserved-collection/
│
├── app/
│   ├── Actions/
│   │   └── Finance/          ← Lógica de negocio (Save, Confirm, Record)
│   ├── Enums/                ← 22 enums de estado y tipo
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Admin/        ← Un controller por recurso
│   │   ├── Requests/
│   │   │   └── Admin/        ← Form Requests (validación)
│   │   └── Resources/        ← JSON Resources (serialización)
│   └── Models/               ← 41 modelos Eloquent
│
├── database/
│   ├── factories/            ← Factories para tests
│   ├── migrations/           ← Una migración por tabla
│   └── seeders/
│
├── resources/
│   └── js/
│       ├── actions/          ← Wayfinder generado (por controller)
│       ├── routes/           ← Wayfinder generado (por nombre de ruta)
│       ├── components/
│       │   └── ui/           ← shadcn/ui components
│       ├── layouts/          ← AppLayout, AuthLayout
│       ├── pages/            ← Páginas Inertia (espejo de rutas)
│       │   ├── crm/
│       │   ├── finance/
│       │   ├── inventory/
│       │   └── portal/
│       └── types/            ← TypeScript types por dominio
│
├── routes/
│   ├── admin.php             ← Todas las rutas admin
│   └── web.php               ← Rutas del portal
│
└── tests/
    └── Feature/
        └── Admin/            ← Tests por módulo (Pest)
```

---

## Patrón Request → Controller → Action → Model

```
HTTP Request
    │
    ▼
Form Request ──── Validación automática (rules + authorize)
    │
    ▼
Controller ─────── Orquesta: recibe request, llama acción, retorna response
    │
    ▼
Action Class ────── Lógica de negocio (transacciones, efectos secundarios)
    │
    ▼
Model / Eloquent ── Persistencia
    │
    ▼
JSON Resource ────── Serialización para el frontend
    │
    ▼
Inertia::render() ── Props al componente React
```

---

## Comunicación Frontend ↔ Backend (Inertia.js)

No hay API REST. El backend usa `Inertia::render('component', $props)` y el frontend recibe las props directamente en el componente React, sin fetch explícito.

```
Navegación:   <Link href={show.url(id)} />       (SPA, sin recarga)
Formularios:  useForm → post/put → validación → redirect + flash
Errores:      llegan como errors.field en useForm automáticamente
```

---

## Wayfinder — Rutas Tipadas

```typescript
// En vez de hardcodear:
post('/admin/finance/receivables')

// Wayfinder genera funciones tipadas:
import { store, show } from '@/routes/admin/finance/receivables'

post(store.url())                          // string URL
show.url(id)                               // "/admin/finance/receivables/5"
create({ query: { client_id: 3 } })        // con query params
```

Regenerar tras cambiar rutas:
```bash
php artisan wayfinder:generate --no-interaction
```

---

## Testing (Pest v4)

```php
// Patrón estándar en tests/Feature/Admin/
beforeEach(fn () => $this->user = User::factory()->admin()->create());

it('creates a receivable', function () {
    $client = Client::factory()->create();

    $this->actingAs($this->user)
        ->post('/admin/finance/receivables', [...])
        ->assertRedirect();

    expect(AccountReceivable::where('client_id', $client->id)->exists())->toBeTrue();
});
```

Ejecutar tests:
```bash
php artisan test --compact                          # todos
php artisan test --compact --filter=AccountReceivable  # filtrado
```

---

## Convenciones

| Área | Convención |
|------|------------|
| Controllers | Solo orquestan, sin lógica de negocio compleja |
| Actions | Un método `handle(...)` con tipado explícito, en `app/Actions/` |
| Form Requests | `authorize(): true`, `rules()` con array notation |
| Resources | `toArray()` con `whenLoaded()` y `whenCounted()` |
| Enums | TitleCase en keys: `PaymentStatus::Pending` |
| Rutas | Named routes, sin hardcodear URLs en el frontend |
| Comentarios | Solo cuando el **por qué** no es obvio |
| Formatter | `vendor/bin/pint --dirty` antes de finalizar cambios PHP |
