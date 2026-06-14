# FamilyShopList — Модель данных Firestore + правила безопасности

> Версия: 0.1 (черновик на утверждение) · 2026-06-14
> Опирается на REQUIREMENTS.md. Цель: всё на бесплатном Spark, без Cloud Functions.

## Принципы
- Данные принадлежат **алиасу** (space), а не пользователю.
- Доступ к данным алиаса имеют только его **активные участники**.
- Вступление в алиас по **коду** должно работать на клиенте + правила Firestore
  (без серверного кода).
- Авторство позиций хранится «снимком» (имя + фото на момент добавления),
  чтобы данные исключённого участника оставались читаемыми.

## Дерево коллекций

```
users/{uid}
  - displayName, email, photoURL
  - defaultAliasId : string | null      // какой алиас открывать при запуске
  - createdAt

invites/{code}                          // code -> alias (для вступления)
  - aliasId, aliasName
  - active : bool

aliases/{aliasId}
  - name
  - ownerId : uid
  - inviteCode : string                  // текущий код; regenerate его меняет
  - createdAt

  members/{uid}                          // ИСТОЧНИК ИСТИНЫ по членству
    - uid                                // дублируем для collectionGroup-запроса
    - displayName, photoURL
    - role   : 'owner' | 'member'
    - status : 'active' | 'removed'      // мягкое исключение
    - code   : string                    // последний использованный код (для правил)
    - joinedAt

  quickItems/{itemId}                    // ЭКРАН 1: один быстрый список на алиас
    - <shopping item, см. ниже>

  lists/{listId}                         // ЭКРАН 2: именованные списки
    - name, createdAt, createdBy
    items/{itemId}
      - <shopping item, см. ниже>

  wishlists/{wishlistId}                 // ЭКРАН 3
    - name, createdAt, createdBy
    items/{itemId}
      - <wishlist item, см. ниже>

  suggestions/{suggestionId}             // история для автозаполнения
    - name, nameLower, count, lastUsedAt
```

## Формы документов

### Shopping item (quickItems и lists/*/items — одинаковые)
```
{
  name        : string,        // как ввёл пользователь (любой язык)
  nameLower   : string,        // для дедупликации и сравнения
  qty         : number | null, // необязательно
  unit        : string,        // необязательно, свободный текст
  done        : bool,
  authorId    : uid,
  authorName  : string,        // снимок
  authorPhoto : string | null, // снимок
  createdAt   : timestamp,
  updatedAt   : timestamp,      // сортировка активных (новые сверху)
  boughtAt    : timestamp|null  // сортировка купленных
}
```
- **Дедупликация (FR-B4):** перед добавлением клиент ищет в коллекции документ
  с таким же `nameLower`. Если есть — обновляет (`qty/unit`, `done=false`,
  `updatedAt=now`), не создаёт новый.
- **Сортировка:** активные `where done==false orderBy updatedAt desc`;
  купленные `where done==true orderBy boughtAt desc`.

### Wishlist item
```
{
  name        : string,
  priority    : 'high' | 'med' | 'low',
  urls        : string[],            // несколько ссылок
  imageUrl    : string | null,       // из microlink или вручную
  title       : string | null,       // из microlink
  authorId, authorName, authorPhoto,
  createdAt, updatedAt
}
```
- **Сортировка (FR-12.6):** клиентская — по приоритету (high→med→low),
  внутри — по `name` (алфавит).
- **Превью:** при добавлении URL клиент дёргает microlink.io (best-effort).
  Вышло — заполняем `imageUrl/title`; нет — поля можно задать вручную.

## Поток вступления по коду (ключевой момент)

Сложность: вступающий ещё НЕ участник, значит по правилам не видит документ алиаса.
Решение без Cloud Functions:

1. У вступающего есть код (ввёл руками или из ссылки `/join/<code>`).
2. Клиент читает `invites/{code}` (разрешено любому залогиненному) →
   получает `aliasId` и `aliasName` (для подтверждения «Join {alias}?»).
3. Клиент создаёт/обновляет свой документ `aliases/{aliasId}/members/{uid}`
   со `status:'active'`, `role:'member'`, `code:<код>`.
4. **Правило** проверяет `code == aliases/{aliasId}.inviteCode` через `get()`
   (в правилах `get()` обходит клиентские read-ограничения). Совпало — членство создано.
5. Теперь участник активен и читает данные алиаса.

- **Исключение (owner):** ставит `members/{uid}.status='removed'`. Участник теряет
  доступ, но документ и авторство его позиций сохраняются.
- **Возврат (FR-11):** исключённый снова вводит код → правило-self-update
  возвращает `status='active'`.
- **Regenerate:** owner меняет `aliases/{id}.inviteCode` и пересоздаёт `invites/{code}`
  (старый помечает `active:false` / удаляет). Старая ссылка больше не вступает.

> ⚠️ Важно при создании алиаса: документ `aliases/{id}` и свой `members/{uid}`
> пишутся ДВУМЯ последовательными операциями (не одним batch) — правило членства
> читает уже существующий документ алиаса.

## Список «моих алиасов» (для переключателя)
`collectionGroup('members').where('uid','==',myUid).where('status','==','active')`
→ из каждого результата берём `aliasId` (родитель) и читаем `aliases/{aliasId}`.
Требует составной индекс (см. ниже).

## Требуемые индексы (firestore.indexes.json)
- collectionGroup `members`: `uid ASC, status ASC`.
- (возможно) `quickItems`/`items`: `done ASC, updatedAt DESC` и `done ASC, boughtAt DESC`
  — Firestore подскажет точную конфигурацию при первом запросе.

## Ограничения / заметки
- Все запросы — клиентские; правила Firestore — единственный барьер безопасности.
- `get()` в правилах = +1 чтение на проверку. Для семьи объём ничтожный.
- microlink.io — внешний best-effort сервис; при недоступности просто нет автопревью.
