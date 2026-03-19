import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Справочник товаров ─────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number;
  supplier: string;
  sku: string;
  stock: number;
  vat: number;
}

const PRODUCT_CATALOG: Product[] = [
  { id: 1,  name: "Ноутбук Pro 15",     category: "Электроника", unit: "шт", price: 98_500,  supplier: "TechCorp",      sku: "NB-001", stock: 24,  vat: 20 },
  { id: 2,  name: "Офисный стул ErgoX", category: "Мебель",      unit: "шт", price: 18_900,  supplier: "OfficeWorld",   sku: "CH-042", stock: 56,  vat: 20 },
  { id: 3,  name: 'Монитор 27" IPS',    category: "Электроника", unit: "шт", price: 32_400,  supplier: "TechCorp",      sku: "MN-027", stock: 18,  vat: 20 },
  { id: 4,  name: "Принтер A4 Laser",   category: "Оргтехника",  unit: "шт", price: 22_100,  supplier: "PrintMaster",   sku: "PR-110", stock: 9,   vat: 20 },
  { id: 5,  name: "Клавиатура Mech",    category: "Периферия",   unit: "шт", price: 7_800,   supplier: "GadgetPlus",    sku: "KB-500", stock: 120, vat: 20 },
  { id: 6,  name: "Мышь беспроводная",  category: "Периферия",   unit: "шт", price: 3_200,   supplier: "GadgetPlus",    sku: "MS-220", stock: 85,  vat: 20 },
  { id: 7,  name: "Стол письменный 1.4м",category: "Мебель",     unit: "шт", price: 24_000,  supplier: "OfficeWorld",   sku: "TB-140", stock: 12,  vat: 20 },
  { id: 8,  name: "Сканер документов",  category: "Оргтехника",  unit: "шт", price: 14_500,  supplier: "PrintMaster",   sku: "SC-300", stock: 6,   vat: 20 },
  { id: 9,  name: "Веб-камера 4K",      category: "Электроника", unit: "шт", price: 9_600,   supplier: "TechCorp",      sku: "WC-400", stock: 33,  vat: 20 },
  { id: 10, name: "Наушники ANC",       category: "Электроника", unit: "шт", price: 18_200,  supplier: "GadgetPlus",    sku: "HP-800", stock: 44,  vat: 20 },
];

// ─── Справочник клиентов ────────────────────────────────────────────────────
interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  manager: string;
  discount: number;
}

const CLIENT_CATALOG: Client[] = [
  { id: 1, name: "Иванов Алексей",    company: "ООО Альфа",        email: "ivanov@alfa.ru",     phone: "+7 (495) 100-01-01", city: "Москва",          manager: "Петров К.",    discount: 5  },
  { id: 2, name: "Смирнова Елена",    company: "ИП Смирнова",      email: "e.smirnova@mail.ru", phone: "+7 (812) 200-02-02", city: "Санкт-Петербург", manager: "Козлов Д.",    discount: 0  },
  { id: 3, name: "Кузнецов Дмитрий", company: "ЗАО Бета Групп",   email: "d.kuz@beta.ru",      phone: "+7 (343) 300-03-03", city: "Екатеринбург",    manager: "Петров К.",    discount: 10 },
  { id: 4, name: "Попова Ирина",      company: "ООО Гамма",        email: "popova@gamma.org",   phone: "+7 (383) 400-04-04", city: "Новосибирск",     manager: "Лебедев Р.",   discount: 3  },
  { id: 5, name: "Новиков Сергей",    company: "ПАО Дельта",       email: "novikov@delta.com",  phone: "+7 (831) 500-05-05", city: "Нижний Новгород", manager: "Козлов Д.",    discount: 7  },
  { id: 6, name: "Морозова Анна",     company: "ООО Эпсилон",      email: "morozova@eps.ru",    phone: "+7 (846) 600-06-06", city: "Самара",          manager: "Лебедев Р.",   discount: 0  },
  { id: 7, name: "Волков Павел",      company: "ИП Волков П.А.",   email: "volkov@inbox.ru",    phone: "+7 (351) 700-07-07", city: "Челябинск",       manager: "Петров К.",    discount: 2  },
  { id: 8, name: "Соколова Татьяна",  company: "ООО Зета Трейд",   email: "sokolova@zeta.ru",   phone: "+7 (473) 800-08-08", city: "Воронеж",         manager: "Козлов Д.",    discount: 15 },
];

// ─── Типы строк таблицы ─────────────────────────────────────────────────────
interface OrderRow {
  id: string;
  clientId: number | null;
  clientName: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  manager: string;
  discount: number;
  productId: number | null;
  productName: string;
  sku: string;
  category: string;
  unit: string;
  price: number;
  qty: number;
  vat: number;
  supplier: string;
}

function emptyRow(id: string): OrderRow {
  return {
    id, clientId: null, clientName: "", company: "", email: "", phone: "",
    city: "", manager: "", discount: 0,
    productId: null, productName: "", sku: "", category: "", unit: "шт",
    price: 0, qty: 1, vat: 20, supplier: "",
  };
}

const INITIAL_ROWS: OrderRow[] = [
  (() => {
    const r = emptyRow("1");
    const c = CLIENT_CATALOG[2]; const p = PRODUCT_CATALOG[0];
    return { ...r, clientId: c.id, clientName: c.name, company: c.company, email: c.email, phone: c.phone, city: c.city, manager: c.manager, discount: c.discount, productId: p.id, productName: p.name, sku: p.sku, category: p.category, unit: p.unit, price: p.price, qty: 2, vat: p.vat, supplier: p.supplier };
  })(),
  (() => {
    const r = emptyRow("2");
    const c = CLIENT_CATALOG[0]; const p = PRODUCT_CATALOG[2];
    return { ...r, clientId: c.id, clientName: c.name, company: c.company, email: c.email, phone: c.phone, city: c.city, manager: c.manager, discount: c.discount, productId: p.id, productName: p.name, sku: p.sku, category: p.category, unit: p.unit, price: p.price, qty: 3, vat: p.vat, supplier: p.supplier };
  })(),
  emptyRow("3"),
];

// ─── Вычисления ─────────────────────────────────────────────────────────────
function calcRow(r: OrderRow) {
  const sub = r.price * r.qty;
  const disc = sub * (r.discount / 100);
  const net = sub - disc;
  const vatAmt = net * (r.vat / 100);
  const total = net + vatAmt;
  return { sub, disc, net, vatAmt, total };
}

// ─── Компонент выпадающего поиска ───────────────────────────────────────────
function SearchDropdown<T extends { id: number; name: string }>({
  value, options, onSelect, placeholder, getLabel,
}: {
  value: string;
  options: T[];
  onSelect: (item: T) => void;
  placeholder: string;
  getLabel: (item: T) => string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(o =>
    getLabel(o).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative min-w-[160px]">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setSearch(""); }}
        className="w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded text-xs text-left transition-colors"
        style={{
          background: value ? "hsl(145 70% 50% / 0.08)" : "hsl(220 15% 14%)",
          border: value ? "1px solid hsl(145 70% 50% / 0.35)" : "1px solid hsl(220 15% 18%)",
          color: value ? "hsl(145 70% 75%)" : "hsl(215 15% 50%)",
        }}
      >
        <span className="truncate">{value || placeholder}</span>
        <Icon name="ChevronDown" size={11} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: "hsl(220 20% 10%)", border: "1px solid hsl(220 15% 20%)" }}>
          <div className="p-2 border-b" style={{ borderColor: "hsl(220 15% 16%)" }}>
            <div className="relative">
              <Icon name="Search" size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg outline-none"
                style={{ background: "hsl(220 15% 14%)", border: "1px solid hsl(220 15% 20%)", color: "hsl(210 20% 90%)" }}
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-xs text-center text-muted-foreground">Ничего не найдено</div>
            )}
            {filtered.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => { onSelect(item); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-xs transition-colors hover:bg-muted flex items-center gap-2"
                style={{ color: "hsl(210 20% 85%)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "hsl(145 70% 50%)" }} />
                {getLabel(item)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Редактируемая ячейка ───────────────────────────────────────────────────
function EditCell({ value, onChange, type = "text", min, className }: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  className?: string;
}) {
  return (
    <input
      type={type}
      min={min}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-2 py-1.5 text-xs rounded outline-none transition-colors mono ${className ?? ""}`}
      style={{
        background: "hsl(220 15% 14%)",
        border: "1px solid hsl(220 15% 18%)",
        color: "hsl(210 20% 88%)",
      }}
      onFocus={e => (e.target.style.borderColor = "hsl(195 90% 55% / 0.6)")}
      onBlur={e => (e.target.style.borderColor = "hsl(220 15% 18%)")}
    />
  );
}

// ─── Главный компонент ──────────────────────────────────────────────────────
export default function SmartTable() {
  const [rows, setRows] = useState<OrderRow[]>(INITIAL_ROWS);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [panelRow, setPanelRow] = useState<OrderRow | null>(null);

  const updateRow = (id: string, patch: Partial<OrderRow>) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  const addRow = () => {
    const id = Date.now().toString();
    setRows(prev => [...prev, emptyRow(id)]);
  };

  const deleteRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const openPanel = (row: OrderRow) => {
    setPanelRow(row);
    setActivePanel(row.id);
  };

  // Итоги
  const totals = rows.reduce(
    (acc, r) => {
      const c = calcRow(r);
      return { sub: acc.sub + c.sub, disc: acc.disc + c.disc, vatAmt: acc.vatAmt + c.vatAmt, total: acc.total + c.total };
    },
    { sub: 0, disc: 0, vatAmt: 0, total: 0 }
  );

  const fmt = (n: number) => n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";

  return (
    <div className="animate-fade-in space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "hsl(145 70% 50%)" }} />
          <span className="text-sm font-semibold text-white">Умная таблица заказов</span>
        </div>
        <span className="text-xs text-muted-foreground mono px-2 py-0.5 rounded"
          style={{ background: "hsl(220 15% 12%)" }}>
          {rows.length} строк
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all">
            <Icon name="Download" size={13} />
            Экспорт
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all">
            <Icon name="Settings2" size={13} />
            Колонки
          </button>
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg font-semibold transition-all hover:opacity-90"
            style={{ background: "hsl(145 70% 50%)", color: "hsl(220 20% 6%)" }}
          >
            <Icon name="Plus" size={13} />
            Добавить строку
          </button>
        </div>
      </div>

      {/* Подсказка */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs"
        style={{ background: "hsl(195 90% 55% / 0.06)", border: "1px solid hsl(195 90% 55% / 0.2)" }}>
        <Icon name="Info" size={13} className="neon-cyan shrink-0" />
        <span className="text-muted-foreground">
          Нажмите на{" "}
          <span className="text-white font-medium">имя клиента</span> или{" "}
          <span className="text-white font-medium">товар</span> — все данные подтянутся автоматически.
          Кнопка{" "}
          <span className="neon-green font-medium">▸</span> открывает детальную карточку строки.
        </span>
      </div>

      {/* Таблица */}
      <div className="rounded-xl border border-border overflow-hidden" style={{ background: "hsl(220 18% 9%)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 1100 }}>
            <thead>
              <tr style={{ background: "hsl(220 20% 7%)" }}>
                {[
                  { label: "Клиент",        w: 170 },
                  { label: "Компания",      w: 140 },
                  { label: "Город",         w: 100 },
                  { label: "Менеджер",      w: 100 },
                  { label: "Товар",         w: 180 },
                  { label: "Артикул",       w: 80  },
                  { label: "Кол-во",        w: 65  },
                  { label: "Цена",          w: 90  },
                  { label: "Скидка %",      w: 70  },
                  { label: "Итого",         w: 100 },
                  { label: "",              w: 60  },
                ].map(col => (
                  <th key={col.label} style={{ width: col.w, minWidth: col.w }}
                    className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const { total } = calcRow(row);
                const isActive = activePanel === row.id;
                return (
                  <tr key={row.id}
                    className="border-b border-border transition-colors"
                    style={{ background: isActive ? "hsl(145 70% 50% / 0.04)" : undefined }}>

                    {/* Клиент — выпадающий */}
                    <td className="px-3 py-2">
                      <SearchDropdown
                        value={row.clientName}
                        options={CLIENT_CATALOG}
                        placeholder="Выбрать клиента..."
                        getLabel={c => c.name}
                        onSelect={c => updateRow(row.id, {
                          clientId: c.id, clientName: c.name, company: c.company,
                          email: c.email, phone: c.phone, city: c.city,
                          manager: c.manager, discount: c.discount,
                        })}
                      />
                    </td>

                    {/* Компания — авто */}
                    <td className="px-3 py-2">
                      <span className={`text-xs ${row.company ? "text-foreground" : "text-muted-foreground"}`}>
                        {row.company || "—"}
                      </span>
                    </td>

                    {/* Город — авто */}
                    <td className="px-3 py-2">
                      <span className={`text-xs ${row.city ? "text-foreground" : "text-muted-foreground"}`}>
                        {row.city || "—"}
                      </span>
                    </td>

                    {/* Менеджер — авто */}
                    <td className="px-3 py-2">
                      {row.manager
                        ? <span className="px-2 py-0.5 rounded-full text-xs"
                            style={{ background: "hsl(270 70% 65% / 0.12)", color: "hsl(270 70% 75%)" }}>
                            {row.manager}
                          </span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>

                    {/* Товар — выпадающий */}
                    <td className="px-3 py-2">
                      <SearchDropdown
                        value={row.productName}
                        options={PRODUCT_CATALOG}
                        placeholder="Выбрать товар..."
                        getLabel={p => p.name}
                        onSelect={p => updateRow(row.id, {
                          productId: p.id, productName: p.name, sku: p.sku,
                          category: p.category, unit: p.unit, price: p.price,
                          vat: p.vat, supplier: p.supplier,
                        })}
                      />
                    </td>

                    {/* Артикул — авто */}
                    <td className="px-3 py-2">
                      <span className="mono text-muted-foreground">{row.sku || "—"}</span>
                    </td>

                    {/* Кол-во — редактируемое */}
                    <td className="px-3 py-2">
                      <EditCell
                        type="number" min={1}
                        value={row.qty}
                        onChange={v => updateRow(row.id, { qty: Math.max(1, Number(v)) })}
                        className="w-16"
                      />
                    </td>

                    {/* Цена — авто */}
                    <td className="px-3 py-2">
                      <span className={`mono text-xs ${row.price ? "text-foreground" : "text-muted-foreground"}`}>
                        {row.price ? row.price.toLocaleString("ru-RU") : "—"}
                      </span>
                    </td>

                    {/* Скидка — авто (из клиента), редактируемое */}
                    <td className="px-3 py-2">
                      <EditCell
                        type="number" min={0}
                        value={row.discount}
                        onChange={v => updateRow(row.id, { discount: Math.min(100, Math.max(0, Number(v))) })}
                        className="w-14"
                      />
                    </td>

                    {/* Итого — авто */}
                    <td className="px-3 py-2">
                      <span className={`mono font-semibold text-xs ${total > 0 ? "neon-green" : "text-muted-foreground"}`}>
                        {total > 0 ? fmt(total) : "—"}
                      </span>
                    </td>

                    {/* Действия */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openPanel(row)}
                          title="Карточка"
                          className="p-1.5 rounded transition-colors hover:bg-muted"
                          style={{ color: isActive ? "hsl(145 70% 55%)" : "hsl(215 15% 50%)" }}
                        >
                          <Icon name="PanelRight" size={13} />
                        </button>
                        <button
                          onClick={() => deleteRow(row.id)}
                          title="Удалить"
                          className="p-1.5 rounded transition-colors hover:bg-muted text-muted-foreground hover:text-red-400"
                        >
                          <Icon name="Trash2" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Итоговая строка */}
            <tfoot>
              <tr style={{ background: "hsl(220 20% 7%)" }}>
                <td colSpan={4} className="px-3 py-3 text-xs font-semibold text-muted-foreground border-t border-border">
                  ИТОГО ({rows.length} позиций)
                </td>
                <td colSpan={4} className="px-3 py-3 border-t border-border">
                  <div className="flex gap-4 text-xs">
                    <span className="text-muted-foreground">Сумма: <span className="text-foreground mono">{fmt(totals.sub)}</span></span>
                    <span className="text-muted-foreground">Скидка: <span className="text-red-400 mono">−{fmt(totals.disc)}</span></span>
                    <span className="text-muted-foreground">НДС: <span className="neon-cyan mono">{fmt(totals.vatAmt)}</span></span>
                  </div>
                </td>
                <td colSpan={3} className="px-3 py-3 border-t border-border text-right">
                  <span className="text-sm font-bold neon-green mono">{fmt(totals.total)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Кнопка добавить */}
      <button
        onClick={addRow}
        className="w-full py-3 rounded-xl border-2 border-dashed text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
        style={{ borderColor: "hsl(220 15% 18%)" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "hsl(145 70% 50% / 0.4)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "hsl(220 15% 18%)")}
      >
        <Icon name="Plus" size={14} />
        Добавить строку
      </button>

      {/* Боковая карточка */}
      {activePanel && panelRow && (
        <DetailPanel
          row={rows.find(r => r.id === panelRow.id) ?? panelRow}
          onClose={() => setActivePanel(null)}
          fmt={fmt}
        />
      )}
    </div>
  );
}

// ─── Боковая карточка строки ────────────────────────────────────────────────
function DetailPanel({ row, onClose, fmt }: { row: OrderRow; onClose: () => void; fmt: (n: number) => string }) {
  const { sub, disc, net, vatAmt, total } = calcRow(row);
  const product = PRODUCT_CATALOG.find(p => p.id === row.productId);
  const client  = CLIENT_CATALOG.find(c => c.id === row.clientId);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={onClose}
        style={{ background: "hsl(220 20% 4% / 0.4)" }}
      />
      <div
        className="absolute right-0 top-0 h-full w-96 pointer-events-auto overflow-y-auto animate-slide-in-right"
        style={{ background: "hsl(220 20% 8%)", borderLeft: "1px solid hsl(220 15% 16%)" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b border-border"
          style={{ background: "hsl(220 20% 8%)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: "hsl(145 70% 50%)" }} />
            <span className="font-semibold text-sm text-white">Карточка строки</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Клиент */}
          {client ? (
            <Section title="Клиент" icon="User" color="neon-cyan">
              <Field label="Имя"      value={client.name} />
              <Field label="Компания" value={client.company} />
              <Field label="Email"    value={client.email} mono />
              <Field label="Телефон"  value={client.phone} mono />
              <Field label="Город"    value={client.city} />
              <Field label="Менеджер" value={client.manager} />
              <Field label="Скидка"   value={`${client.discount}%`} highlight />
            </Section>
          ) : (
            <EmptySection title="Клиент не выбран" icon="User" />
          )}

          {/* Товар */}
          {product ? (
            <Section title="Товар" icon="Package" color="neon-purple">
              <Field label="Название"   value={product.name} />
              <Field label="Артикул"    value={product.sku} mono />
              <Field label="Категория"  value={product.category} />
              <Field label="Поставщик"  value={product.supplier} />
              <Field label="Ед.изм."    value={product.unit} />
              <Field label="На складе"  value={`${product.stock} шт`} highlight={product.stock < 10} />
            </Section>
          ) : (
            <EmptySection title="Товар не выбран" icon="Package" />
          )}

          {/* Расчёт */}
          <Section title="Расчёт" icon="Calculator" color="neon-green">
            <div className="space-y-2">
              <CalcLine label="Цена × кол-во" value={fmt(sub)} />
              <CalcLine label={`Скидка ${row.discount}%`} value={`−${fmt(disc)}`} red={disc > 0} />
              <div className="border-t border-border pt-2">
                <CalcLine label="Сумма без НДС" value={fmt(net)} />
              </div>
              <CalcLine label={`НДС ${row.vat}%`} value={fmt(vatAmt)} cyan />
              <div className="border-t border-border pt-2 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">Итого</span>
                  <span className="text-lg font-bold neon-green mono">{fmt(total)}</span>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border"
        style={{ background: "hsl(220 20% 6%)" }}>
        <Icon name={icon} size={14} className={color} />
        <span className="text-xs font-semibold text-white uppercase tracking-wide">{title}</span>
      </div>
      <div className="px-4 py-3 space-y-2" style={{ background: "hsl(220 18% 9%)" }}>
        {children}
      </div>
    </div>
  );
}

function EmptySection({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-5 flex items-center gap-3">
      <Icon name={icon} size={16} className="text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{title}</span>
    </div>
  );
}

function Field({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs text-right ${mono ? "mono" : ""} ${highlight ? "neon-green font-semibold" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

function CalcLine({ label, value, red, cyan }: { label: string; value: string; red?: boolean; cyan?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs mono font-medium ${red ? "text-red-400" : cyan ? "neon-cyan" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
