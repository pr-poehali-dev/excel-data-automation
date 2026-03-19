import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/9a3ffd95-22d3-4c74-8645-d783a0caaf59";

export interface CatalogClient {
  id: number; name: string; company: string; email: string;
  phone: string; city: string; manager: string; discount: number;
}
export interface CatalogProduct {
  id: number; name: string; category: string; unit: string;
  price: number; supplier: string; sku: string; stock: number; vat: number;
}

// ─── хук загрузки ───────────────────────────────────────────────────────────
export function useCatalog() {
  const [clients, setClients]   = useState<CatalogClient[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading]   = useState(true);

  const reload = async () => {
    setLoading(true);
    const [c, p] = await Promise.all([
      fetch(`${API}?type=clients`).then(r => r.json()),
      fetch(`${API}?type=products`).then(r => r.json()),
    ]);
    setClients(c);
    setProducts(p);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);
  return { clients, products, loading, reload };
}

// ─── поля форм ──────────────────────────────────────────────────────────────
const CLIENT_FIELDS = [
  { key: "name",     label: "Имя",       type: "text",   required: true },
  { key: "company",  label: "Компания",  type: "text" },
  { key: "email",    label: "Email",     type: "email" },
  { key: "phone",    label: "Телефон",   type: "text" },
  { key: "city",     label: "Город",     type: "text" },
  { key: "manager",  label: "Менеджер",  type: "text" },
  { key: "discount", label: "Скидка %",  type: "number" },
] as const;

const PRODUCT_FIELDS = [
  { key: "name",     label: "Название",   type: "text",   required: true },
  { key: "sku",      label: "Артикул",    type: "text" },
  { key: "category", label: "Категория",  type: "text" },
  { key: "unit",     label: "Ед. изм.",   type: "text" },
  { key: "price",    label: "Цена ₽",     type: "number" },
  { key: "supplier", label: "Поставщик",  type: "text" },
  { key: "stock",    label: "Склад, шт",  type: "number" },
  { key: "vat",      label: "НДС %",      type: "number" },
] as const;

type EntityType = "clients" | "products";

// ─── Modal формы ────────────────────────────────────────────────────────────
function FormModal<T extends Record<string, unknown>>({
  title, fields, initial, onSave, onClose, saving,
}: {
  title: string;
  fields: readonly { key: string; label: string; type: string; required?: boolean }[];
  initial: Partial<T>;
  onSave: (data: Partial<T>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<T>>(initial);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "hsl(220 20% 4% / 0.85)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg rounded-2xl border border-border overflow-hidden animate-slide-up"
        style={{ background: "hsl(220 18% 9%)" }}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between"
          style={{ background: "hsl(220 20% 7%)" }}>
          <span className="font-semibold text-white">{title}</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {fields.map(f => (
            <div key={f.key} className={f.key === "name" ? "col-span-2" : ""}>
              <label className="text-xs text-muted-foreground block mb-1.5">
                {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              <input
                type={f.type}
                value={(form[f.key as keyof T] as string | number) ?? ""}
                onChange={e => setForm(prev => ({
                  ...prev,
                  [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
                style={{ fontFamily: f.type === "number" ? "IBM Plex Mono, monospace" : undefined }}
              />
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form["name"]}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: "hsl(145 70% 50%)", color: "hsl(220 20% 6%)" }}
          >
            {saving
              ? <><Icon name="Loader2" size={14} className="animate-spin" /> Сохраняю...</>
              : <><Icon name="Check" size={14} /> Сохранить</>}
          </button>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Главный компонент страницы ──────────────────────────────────────────────
export default function CatalogPage({
  clients, products, onReload,
}: {
  clients: CatalogClient[];
  products: CatalogProduct[];
  onReload: () => void;
}) {
  const [tab, setTab]           = useState<EntityType>("clients");
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState<"create" | "edit" | null>(null);
  const [editing, setEditing]   = useState<Record<string, unknown>>({});
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toast, setToast]       = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const items = tab === "clients" ? clients : products;
  const filtered = items.filter(item =>
    (item.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    ("company" in item ? item.company : "").toLowerCase().includes(search.toLowerCase()) ||
    ("sku" in item ? item.sku : "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(tab === "clients"
      ? { name: "", company: "", email: "", phone: "", city: "", manager: "", discount: 0 }
      : { name: "", category: "", unit: "шт", price: 0, supplier: "", sku: "", stock: 0, vat: 20 }
    );
    setModal("create");
  };

  const openEdit = (item: Record<string, unknown>) => {
    setEditing({ ...item });
    setModal("edit");
  };

  const handleSave = async (data: Record<string, unknown>) => {
    setSaving(true);
    const method = modal === "create" ? "POST" : "PUT";
    await fetch(`${API}?type=${tab}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setModal(null);
    onReload();
    showToast(modal === "create" ? "Запись добавлена" : "Запись обновлена");
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    await fetch(`${API}?type=${tab}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    onReload();
    showToast("Запись удалена");
  };

  const fields = tab === "clients" ? CLIENT_FIELDS : PRODUCT_FIELDS;
  const fmt = (n: number) => n.toLocaleString("ru-RU");

  return (
    <div className="animate-fade-in space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-xl border border-border p-1 gap-1" style={{ background: "hsl(220 18% 9%)" }}>
          {([["clients", "Клиенты", "Users", clients.length], ["products", "Товары", "Package", products.length]] as const).map(([id, label, icon, count]) => (
            <button key={id} onClick={() => { setTab(id); setSearch(""); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={tab === id ? {
                background: "hsl(145 70% 50% / 0.12)",
                color: "hsl(145 70% 50%)",
                border: "1px solid hsl(145 70% 50% / 0.25)",
              } : { color: "hsl(215 15% 55%)" }}>
              <Icon name={icon} size={15} />
              {label}
              <span className="text-xs px-1.5 py-0.5 rounded mono"
                style={{ background: "hsl(220 15% 14%)", color: "hsl(215 15% 50%)" }}>
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative ml-2">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Поиск ${tab === "clients" ? "клиентов" : "товаров"}...`}
            className="pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors w-56"
          />
        </div>

        <div className="ml-auto">
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "hsl(145 70% 50%)", color: "hsl(220 20% 6%)" }}>
            <Icon name="Plus" size={15} />
            {tab === "clients" ? "Добавить клиента" : "Добавить товар"}
          </button>
        </div>
      </div>

      {/* Таблица клиентов */}
      {tab === "clients" && (
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: "hsl(220 18% 9%)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "hsl(220 20% 7%)" }}>
                {["Имя", "Компания", "Email", "Телефон", "Город", "Менеджер", "Скидка", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">Ничего не найдено</td></tr>
              )}
              {(filtered as CatalogClient[]).map(c => (
                <tr key={c.id} className="border-b border-border hover:bg-muted transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{c.company || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground mono">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-xs mono text-foreground">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{c.city || "—"}</td>
                  <td className="px-4 py-3">
                    {c.manager
                      ? <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "hsl(270 70% 65% / 0.12)", color: "hsl(270 70% 75%)" }}>{c.manager}</span>
                      : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold mono"
                      style={{ color: c.discount > 0 ? "hsl(145 70% 55%)" : "hsl(215 15% 50%)" }}>
                      {c.discount > 0 ? `${c.discount}%` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      onEdit={() => openEdit(c as unknown as Record<string, unknown>)}
                      onDelete={() => handleDelete(c.id)}
                      deleting={deleting === c.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <TableFooter count={filtered.length} total={items.length} label="клиентов" />
        </div>
      )}

      {/* Таблица товаров */}
      {tab === "products" && (
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: "hsl(220 18% 9%)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "hsl(220 20% 7%)" }}>
                {["Название", "Артикул", "Категория", "Цена", "Поставщик", "Склад", "НДС", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">Ничего не найдено</td></tr>
              )}
              {(filtered as CatalogProduct[]).map(p => (
                <tr key={p.id} className="border-b border-border hover:bg-muted transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3 text-xs mono text-muted-foreground">{p.sku || "—"}</td>
                  <td className="px-4 py-3">
                    {p.category
                      ? <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "hsl(195 90% 55% / 0.1)", color: "hsl(195 90% 55%)" }}>{p.category}</span>
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm mono font-semibold" style={{ color: "hsl(145 70% 55%)" }}>
                    {fmt(p.price)} ₽
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{p.supplier || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs mono font-medium"
                      style={{ color: p.stock < 10 ? "hsl(30 90% 60%)" : "hsl(215 15% 65%)" }}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs mono text-muted-foreground">{p.vat}%</td>
                  <td className="px-4 py-3">
                    <RowActions
                      onEdit={() => openEdit(p as unknown as Record<string, unknown>)}
                      onDelete={() => handleDelete(p.id)}
                      deleting={deleting === p.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <TableFooter count={filtered.length} total={items.length} label="товаров" />
        </div>
      )}

      {/* Модалка */}
      {modal && (
        <FormModal
          title={modal === "create"
            ? (tab === "clients" ? "Новый клиент" : "Новый товар")
            : (tab === "clients" ? "Редактировать клиента" : "Редактировать товар")}
          fields={fields}
          initial={editing}
          onSave={handleSave as (data: Partial<Record<string, unknown>>) => void}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl animate-slide-up"
          style={{ background: "hsl(145 70% 50%)", color: "hsl(220 20% 6%)" }}>
          <Icon name="CheckCircle" size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function RowActions({ onEdit, onDelete, deleting }: { onEdit: () => void; onDelete: () => void; deleting: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onEdit}
        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        <Icon name="Pencil" size={13} />
      </button>
      <button onClick={onDelete} disabled={deleting}
        className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-muted transition-colors disabled:opacity-40">
        {deleting ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Trash2" size={13} />}
      </button>
    </div>
  );
}

function TableFooter({ count, total, label }: { count: number; total: number; label: string }) {
  return (
    <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground mono">
      {count === total ? `${total} ${label}` : `${count} из ${total} ${label}`}
    </div>
  );
}
