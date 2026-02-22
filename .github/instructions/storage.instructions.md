---
applyTo: 'src/lib/storage/**'
---

# Storage Conventions

## Padrões

- Operações atômicas via `updateStorageAtomically()` com updater puro `(current: T) => T`
- Fila sequencial por chave para prevenir race conditions
- Chaves usam prefixo `fill_all_` (mapeadas em `STORAGE_KEYS`)
- `chrome.storage.local` — nunca `sync`

## Error Handling

- Nunca throw — retornar fallback ou valor default
- Logar erros com contexto: `log.warn("Failed to save rules:", err)`

## Naming

- `get*()`, `save*()`, `delete*()` para operações CRUD
- `*ForUrl()` para queries filtradas por URL pattern
