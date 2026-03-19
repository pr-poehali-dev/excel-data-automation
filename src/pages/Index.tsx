import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import SmartTable from "@/components/SmartTable";

const EXCEL_IMPORT_URL = "https://functions.poehali.dev/3d2cdaca-8358-4114-976e-10519904677d";

type ActiveTab = "dashboard" | "import" | "sources" | "tables" | "smart";
type DBType = "postgresql" | "mysql" | "mongodb" | "mssql" | "oracle" | "redis";

interface DataSource {
  id: string;
  name: string;
  type: DBType;
  host: string;
  status: "connected" | "disconnected" | "error";
  lastSync: string;
  records: number;
}

const DB_CONFIGS: Record<DBType, { label: string; color: string; icon: string; port: string }> = {
  postgresql: { label: "PostgreSQL",    color: "neon-cyan",   icon: "Database",   port: "5432"  },
  mysql:      { label: "MySQL",         color: "neon-orange", icon: "Database",   port: "3306"  },
  mongodb:    { label: "MongoDB",       color: "neon-green",  icon: "Layers",     port: "27017" },
  mssql:      { label: "MS SQL Server", color: "neon-purple", icon: "Server",     port: "1433"  },
  oracle:     { label: "Oracle DB",     color: "neon-orange", icon: "HardDrive",  port: "1521"  },
  redis:      { label: "Redis",         color: "neon-cyan",   icon: "Zap",        port: "6379"  },
};

const MOCK_SOURCES: DataSource[] = [
  { id: "1", name: "Продажи 2024",  type: "postgresql", host: "db.company.ru",  status: "connected",    lastSync: "2 мин назад",  records: 48320 },
  { id: "2", name: "CRM клиенты",   type: "mongodb",    host: "mongo.crm.io",   status: "connected",    lastSync: "15 мин назад", records: 12540 },
  { id: "3", name: "Финансы",       type: "mysql",      host: "fin.internal",   status: "error",        lastSync: "1 час назад",  records: 8900  },
];

const MOCK_TABLE = [
  { id: 1, product: "Ноутбук Pro 15", category: "Электроника", sales: 142, revenue: 14_200_000, growth: 12.4  },
  { id: 2, product: "Офисный стул",   category: "Мебель",       sales: 89,  revenue: 2_670_000,  growth: -3.1  },
  { id: 3, product: 'Монитор 27"',    category: "Электроника", sales: 203, revenue: 10_150_000, growth: 24.7  },
  { id: 4, product: "Принтер A4",     category: "Оргтехника",   sales: 67,  revenue: 2_345_000,  growth: 5.2   },
  { id: 5, product: "Клавиатура",     category: "Периферия",    sales: 310, revenue: 1_550_000,  growth: 8.9   },
];

const STATS = [
  { label: "Источников данных",   value: "12",    delta: "+3",    icon: "Database",        color: "neon-green"  },
  { label: "Строк обработано",    value: "847K",  delta: "+12%",  icon: "BarChart2",       color: "neon-cyan"   },
  { label: "Excel файлов",        value: "34",    delta: "+8",    icon: "FileSpreadsheet", color: "neon-purple" },
  { label: "Авто-обновлений",     value: "1,204", delta: "сегодня", icon: "RefreshCw",     color: "neon-orange" },
];

const BAR_HEIGHTS = [38, 55, 42, 71, 63, 29, 85, 47, 62, 78, 44, 53, 36, 69, 82, 57, 41, 74, 60, 33, 88, 51, 45, 67];

interface ParsedData {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  sheetNames: string[];
  filename: string;
}

export default function Index() {
  const [activeTab, setActiveTab]           = useState<ActiveTab>("dashboard");
  const [selectedDB, setSelectedDB]         = useState<DBType>("postgresql");
  const [sources, setSources]               = useState<DataSource[]>(MOCK_SOURCES);
  const [dragActive, setDragActive]         = useState(false);
  const [uploadedFile, setUploadedFile]     = useState<string | null>(null);
  const [syncInterval, setSyncInterval]     = useState("5");
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connForm, setConnForm]             = useState({ name: "", host: "", port: "", db: "", user: "", pass: "" });
  const [importing, setImporting]           = useState(false);
  const [importError, setImportError]       = useState<string | null>(null);
  const [parsedData, setParsedData]         = useState<ParsedData | null>(null);
  const [sheetIndex, setSheetIndex]         = useState(0);
  const [headerRow, setHeaderRow]           = useState(0);
  const [encoding, setEncoding]             = useState("utf-8");
  const [delimiter, setDelimiter]           = useState(",");
  const fileRef = useRef<File | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) { fileRef.current = file; setUploadedFile(file.name); setParsedData(null); setImportError(null); }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { fileRef.current = file; setUploadedFile(file.name); setParsedData(null); setImportError(null); }
  };

  const handleImport = async () => {
    if (!fileRef.current) return;
    setImporting(true);
    setImportError(null);
    try {
      const buffer = await fileRef.current.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const res = await fetch(EXCEL_IMPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: b64,
          filename: fileRef.current.name,
          sheetIndex,
          headerRow,
          encoding,
          delimiter,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка сервера");
      setParsedData(data);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setImporting(false);
    }
  };

  const handleConnect = () => {
    if (!connForm.name || !connForm.host) return;
    const newSource: DataSource = {
      id: Date.now().toString(),
      name: connForm.name,
      type: selectedDB,
      host: connForm.host,
      status: "connected",
      lastSync: "только что",
      records: 0,
    };
    setSources(prev => [newSource, ...prev]);
    setShowConnectModal(false);
    setConnForm({ name: "", host: "", port: "", db: "", user: "", pass: "" });
  };

  const navItems: { id: ActiveTab; label: string; icon: string; badge?: string }[] = [
    { id: "dashboard", label: "Дашборд",        icon: "LayoutDashboard"  },
    { id: "import",    label: "Импорт Excel",    icon: "FileSpreadsheet"  },
    { id: "sources",   label: "Источники БД",    icon: "Database"         },
    { id: "tables",    label: "Таблицы",          icon: "Table2"           },
    { id: "smart",     label: "Умные таблицы",   icon: "Sparkles", badge: "NEW" },
  ];

  return (
    <div className="min-h-screen bg-background font-golos flex">
      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-border flex flex-col shrink-0 fixed h-full z-10"
        style={{ background: "hsl(220 20% 7%)" }}>
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(145 70% 50% / 0.15)", border: "1px solid hsl(145 70% 50% / 0.4)" }}>
              <Icon name="Zap" size={16} className="neon-green" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide text-white">DataFlow</div>
              <div className="text-xs text-muted-foreground mono">v1.0.0</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.id ? "text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              style={activeTab === item.id ? {
                background: "hsl(145 70% 50% / 0.12)",
                border: "1px solid hsl(145 70% 50% / 0.25)",
                color: "hsl(145 70% 50%)",
              } : {}}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
              {item.id === "sources" && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-md mono"
                  style={{ background: "hsl(145 70% 50% / 0.15)", color: "hsl(145 70% 50%)" }}>
                  {sources.length}
                </span>
              )}
              {item.badge && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-md font-bold tracking-wide"
                  style={{ background: "hsl(30 90% 60% / 0.2)", color: "hsl(30 90% 65%)" }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot inline-block" />
            Синхронизация активна
          </div>
          <div className="mt-1 text-xs mono text-muted-foreground">Обновление каждые {syncInterval} мин</div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 ml-64 overflow-auto">
        <header className="sticky top-0 z-10 border-b border-border px-8 py-4 flex items-center justify-between backdrop-blur-sm"
          style={{ background: "hsl(220 20% 6% / 0.9)" }}>
          <div>
            <h1 className="text-lg font-bold text-white">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeTab === "dashboard" && "Общая сводка по данным"}
              {activeTab === "import"    && "Загрузка и настройка Excel файлов"}
              {activeTab === "sources"   && "Управление подключениями к базам данных"}
              {activeTab === "tables"    && "Просмотр и редактирование таблиц"}
              {activeTab === "smart"     && "Выпадающие списки с автозаполнением данных"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-muted-foreground">
              <Icon name="Bell" size={15} />
            </button>
            <button
              onClick={() => setShowConnectModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "hsl(145 70% 50%)", color: "hsl(220 20% 6%)" }}
            >
              <Icon name="Plus" size={15} />
              Добавить источник
            </button>
          </div>
        </header>

        <div className="p-8">

          {/* ── DASHBOARD ── */}
          {activeTab === "dashboard" && (
            <div className="animate-fade-in space-y-8">
              <div className="grid grid-cols-4 gap-4">
                {STATS.map((s, i) => (
                  <div key={s.label} className="rounded-xl border border-border p-5 hover-card"
                    style={{ background: "hsl(220 18% 9%)", animationDelay: `${i * 80}ms` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}
                        style={{ background: "hsl(220 15% 14%)" }}>
                        <Icon name={s.icon} size={18} />
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full mono"
                        style={{ background: "hsl(145 70% 50% / 0.1)", color: "hsl(145 70% 50%)" }}>
                        {s.delta}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white mono">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border overflow-hidden" style={{ background: "hsl(220 18% 9%)" }}>
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold text-white">Активные источники</h2>
                  <button onClick={() => setActiveTab("sources")} className="text-xs neon-green hover:underline">
                    Все источники →
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {sources.map(src => <SourceRow key={src.id} source={src} />)}
                </div>
              </div>

              <div className="rounded-xl border border-border p-6" style={{ background: "hsl(220 18% 9%)" }}>
                <h2 className="font-semibold text-white mb-4">Активность синхронизации (24ч)</h2>
                <div className="flex items-end gap-1 h-28">
                  {BAR_HEIGHTS.map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm transition-all hover:opacity-80 cursor-default"
                      style={{
                        height: `${h}%`,
                        background: h > 70 ? "hsl(145 70% 50% / 0.75)" : "hsl(145 70% 50% / 0.25)",
                      }} />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mono mt-2">
                  <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
                </div>
              </div>
            </div>
          )}

          {/* ── IMPORT ── */}
          {activeTab === "import" && (
            <div className="animate-fade-in space-y-6 max-w-3xl">
              <div
                className={`rounded-xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
                  dragActive ? "border-glow-green scale-[1.01]" : "border-border hover:border-muted-foreground"
                }`}
                style={{ background: dragActive ? "hsl(145 70% 50% / 0.05)" : "hsl(220 18% 9%)" }}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <input id="fileInput" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileInput} />
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "hsl(145 70% 50% / 0.1)", border: "1px solid hsl(145 70% 50% / 0.3)" }}>
                  <Icon name="FileSpreadsheet" size={26} className="neon-green" />
                </div>
                {uploadedFile ? (
                  <>
                    <div className="text-white font-semibold">{uploadedFile}</div>
                    <div className="text-sm text-muted-foreground mt-1">Файл готов к обработке</div>
                    <div className="flex items-center justify-center gap-1.5 mt-2 neon-green text-sm">
                      <Icon name="CheckCircle" size={15} /> Загружен успешно
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-white font-semibold text-lg">Перетащите Excel файл сюда</div>
                    <div className="text-sm text-muted-foreground mt-1">или нажмите для выбора · .xlsx .xls .csv</div>
                  </>
                )}
              </div>

              <div className="rounded-xl border border-border p-6 space-y-5" style={{ background: "hsl(220 18% 9%)" }}>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Icon name="Settings2" size={16} className="neon-cyan" />
                  Настройки импорта
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Строка заголовков</label>
                    <select value={headerRow} onChange={e => setHeaderRow(Number(e.target.value))}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ring">
                      <option value={0}>Строка 1</option>
                      <option value={1}>Строка 2</option>
                      <option value={2}>Строка 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Лист Excel</label>
                    <select value={sheetIndex} onChange={e => setSheetIndex(Number(e.target.value))}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ring">
                      {parsedData?.sheetNames.map((s, i) => <option key={i} value={i}>{s}</option>) ?? <option value={0}>Лист 1</option>}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Кодировка</label>
                    <select value={encoding} onChange={e => setEncoding(e.target.value)}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ring">
                      <option value="utf-8">UTF-8</option>
                      <option value="windows-1251">Windows-1251</option>
                      <option value="iso-8859-1">ISO-8859-1</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Разделитель (CSV)</label>
                    <select value={delimiter} onChange={e => setDelimiter(e.target.value)}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ring">
                      <option value=",">Запятая (,)</option>
                      <option value=";">Точка с запятой (;)</option>
                      <option value="\t">Табуляция</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleImport}
                    disabled={!uploadedFile || importing}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ background: "hsl(145 70% 50%)", color: "hsl(220 20% 6%)" }}
                  >
                    {importing
                      ? <><Icon name="Loader2" size={14} className="animate-spin" /> Обработка...</>
                      : <><Icon name="Upload" size={14} /> Импортировать</>
                    }
                  </button>
                  {parsedData && (
                    <span className="text-xs neon-green flex items-center gap-1.5">
                      <Icon name="CheckCircle" size={13} />
                      {parsedData.totalRows.toLocaleString()} строк загружено
                    </span>
                  )}
                </div>
                {importError && (
                  <div className="rounded-lg px-4 py-3 text-sm text-red-400 flex items-center gap-2"
                    style={{ background: "hsl(0 75% 55% / 0.1)", border: "1px solid hsl(0 75% 55% / 0.3)" }}>
                    <Icon name="AlertCircle" size={15} />
                    {importError}
                  </div>
                )}
              </div>

              {/* Result table */}
              {parsedData && parsedData.rows.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden animate-fade-in" style={{ background: "hsl(220 18% 9%)" }}>
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{parsedData.filename}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 mono">
                        {parsedData.totalRows.toLocaleString()} строк · {parsedData.headers.length} колонок
                        {parsedData.sheetNames.length > 1 && ` · ${parsedData.sheetNames.length} листов`}
                      </p>
                    </div>
                    <button
                      onClick={() => { setActiveTab("tables"); }}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-90"
                      style={{ background: "hsl(145 70% 50% / 0.15)", color: "hsl(145 70% 50%)" }}
                    >
                      Открыть в таблицах →
                    </button>
                  </div>
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0" style={{ background: "hsl(220 20% 7%)" }}>
                        <tr>
                          {parsedData.headers.map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground border-b border-border whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.rows.slice(0, 50).map((row, i) => (
                          <tr key={i} className="border-b border-border hover:bg-muted transition-colors">
                            {parsedData.headers.map(h => (
                              <td key={h} className="px-4 py-2 text-xs text-foreground whitespace-nowrap mono">
                                {row[h] !== null && row[h] !== undefined ? String(row[h]) : <span className="text-muted-foreground">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.totalRows > 50 && (
                    <div className="px-6 py-3 text-xs text-muted-foreground mono border-t border-border">
                      Показано 50 из {parsedData.totalRows.toLocaleString()} строк
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-border p-6" style={{ background: "hsl(220 18% 9%)" }}>
                <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
                  <Icon name="RefreshCw" size={16} className="neon-purple" />
                  Автоматическое обновление
                </h3>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-muted-foreground">Обновлять каждые</label>
                  <select
                    value={syncInterval}
                    onChange={e => setSyncInterval(e.target.value)}
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ring"
                  >
                    <option value="1">1 минуту</option>
                    <option value="5">5 минут</option>
                    <option value="15">15 минут</option>
                    <option value="60">1 час</option>
                    <option value="0">Вручную</option>
                  </select>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
                    Активно
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SOURCES ── */}
          {activeTab === "sources" && (
            <div className="animate-fade-in space-y-6">
              <div className="grid grid-cols-6 gap-3">
                {(Object.entries(DB_CONFIGS) as [DBType, typeof DB_CONFIGS[DBType]][]).map(([type, cfg]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedDB(type)}
                    className="rounded-xl border p-4 text-center transition-all hover-card"
                    style={{
                      background: selectedDB === type ? "hsl(145 70% 50% / 0.08)" : "hsl(220 18% 9%)",
                      borderColor: selectedDB === type ? "hsl(145 70% 50% / 0.4)" : "hsl(var(--border))",
                    }}
                  >
                    <Icon name={cfg.icon} size={22} className={`mx-auto mb-2 ${cfg.color}`} />
                    <div className={`text-xs font-medium ${selectedDB === type ? "neon-green" : "text-muted-foreground"}`}>
                      {cfg.label}
                    </div>
                    <div className="text-xs text-muted-foreground mono mt-0.5">:{cfg.port}</div>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-border p-6" style={{ background: "hsl(220 18% 9%)" }}>
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-2 h-2 rounded-full" style={{ background: "hsl(195 90% 55%)" }} />
                  <h3 className="font-semibold text-white">
                    Новое подключение —{" "}
                    <span className="neon-cyan">{DB_CONFIGS[selectedDB].label}</span>
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground block mb-1.5">Название подключения</label>
                    <input
                      value={connForm.name}
                      onChange={e => setConnForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Например: Продажи Q1 2024"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Хост / IP</label>
                    <input
                      value={connForm.host}
                      onChange={e => setConnForm(f => ({ ...f, host: e.target.value }))}
                      placeholder="localhost"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Порт</label>
                    <input
                      value={connForm.port || DB_CONFIGS[selectedDB].port}
                      onChange={e => setConnForm(f => ({ ...f, port: e.target.value }))}
                      placeholder={DB_CONFIGS[selectedDB].port}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">База данных</label>
                    <input
                      value={connForm.db}
                      onChange={e => setConnForm(f => ({ ...f, db: e.target.value }))}
                      placeholder="mydb"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Пользователь</label>
                    <input
                      value={connForm.user}
                      onChange={e => setConnForm(f => ({ ...f, user: e.target.value }))}
                      placeholder="admin"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Пароль</label>
                    <input
                      type="password"
                      value={connForm.pass}
                      onChange={e => setConnForm(f => ({ ...f, pass: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={handleConnect}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: "hsl(145 70% 50%)", color: "hsl(220 20% 6%)" }}
                  >
                    <Icon name="Plug" size={14} className="inline mr-1.5" />
                    Подключить
                  </button>
                  <button className="px-5 py-2.5 rounded-lg text-sm font-medium border border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground transition-all">
                    <Icon name="FlaskConical" size={14} className="inline mr-1.5" />
                    Проверить связь
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border overflow-hidden" style={{ background: "hsl(220 18% 9%)" }}>
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="font-semibold text-white">Подключённые источники</h3>
                </div>
                <div className="divide-y divide-border">
                  {sources.map(src => <SourceRow key={src.id} source={src} extended />)}
                </div>
              </div>
            </div>
          )}

          {/* ── TABLES ── */}
          {activeTab === "tables" && (
            <div className="animate-fade-in space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder="Поиск по таблице..."
                    className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
                  />
                </div>
                <button className="flex items-center gap-2 px-3 py-2.5 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all">
                  <Icon name="Filter" size={14} />
                  Фильтры
                </button>
                <button className="flex items-center gap-2 px-3 py-2.5 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all">
                  <Icon name="Download" size={14} />
                  Экспорт
                </button>
                <div className="ml-auto text-xs text-muted-foreground mono px-3 py-2.5 border border-border rounded-lg"
                  style={{ background: "hsl(220 18% 9%)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse-dot" />
                  Авто: {syncInterval === "0" ? "выкл" : `${syncInterval} мин`}
                </div>
              </div>

              <div className="rounded-xl border border-border overflow-hidden" style={{ background: "hsl(220 18% 9%)" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "hsl(220 20% 7%)" }}>
                      {["#", "Товар", "Категория", "Продажи", "Выручка", "Рост"].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border cursor-pointer hover:text-foreground transition-colors">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_TABLE.map((row, i) => (
                      <tr key={row.id} className="border-b border-border hover:bg-muted transition-colors"
                        style={{ animationDelay: `${i * 60}ms` }}>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground mono">{String(row.id).padStart(3, "0")}</td>
                        <td className="px-5 py-3.5 text-sm font-medium text-white">{row.product}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "hsl(195 90% 55% / 0.1)", color: "hsl(195 90% 55%)" }}>
                            {row.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm mono text-foreground">{row.sales.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-sm mono text-foreground">
                          {(row.revenue / 1_000_000).toFixed(1)}M ₽
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold mono flex items-center gap-1 ${row.growth >= 0 ? "neon-green" : "text-red-400"}`}>
                            <Icon name={row.growth >= 0 ? "TrendingUp" : "TrendingDown"} size={12} />
                            {row.growth > 0 ? "+" : ""}{row.growth}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-3 flex items-center justify-between border-t border-border">
                  <span className="text-xs text-muted-foreground mono">Показано 5 из 847,320 записей</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, "...", 12].map((p, i) => (
                      <button key={i}
                        className="w-7 h-7 rounded text-xs mono transition-colors text-muted-foreground hover:text-foreground"
                        style={p === 1 ? { background: "hsl(145 70% 50% / 0.2)", color: "hsl(145 70% 50%)" } : {}}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SMART TABLE ── */}
          {activeTab === "smart" && (
            <SmartTable />
          )}
        </div>
      </main>

      {/* ── Modal ── */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "hsl(220 20% 4% / 0.8)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl border border-border p-6 animate-slide-up"
            style={{ background: "hsl(220 18% 9%)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white">Добавить источник</h3>
              <button onClick={() => setShowConnectModal(false)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={18} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Выберите тип базы данных для подключения:
            </p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {(["postgresql", "mysql", "mongodb"] as DBType[]).map(type => (
                <button key={type}
                  onClick={() => { setSelectedDB(type); setShowConnectModal(false); setActiveTab("sources"); }}
                  className="p-3 rounded-xl border border-border hover:border-muted-foreground text-center transition-all hover-card"
                  style={{ background: "hsl(220 20% 6%)" }}>
                  <Icon name={DB_CONFIGS[type].icon} size={20} className={`mx-auto mb-1.5 ${DB_CONFIGS[type].color}`} />
                  <div className="text-xs text-muted-foreground">{DB_CONFIGS[type].label}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowConnectModal(false); setActiveTab("sources"); }}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "hsl(145 70% 50%)", color: "hsl(220 20% 6%)" }}>
              Все источники данных →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SourceRow({ source, extended }: { source: DataSource; extended?: boolean }) {
  const cfg = DB_CONFIGS[source.type];
  const statusColor =
    source.status === "connected" ? "#34d399" :
    source.status === "error"     ? "#f87171" : "#6b7280";
  const statusLabel =
    source.status === "connected" ? "Подключён" :
    source.status === "error"     ? "Ошибка"    : "Отключён";

  return (
    <div className="px-6 py-4 flex items-center gap-4 hover:bg-muted transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}
        style={{ background: "hsl(220 15% 14%)" }}>
        <Icon name={cfg.icon} size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{source.name}</div>
        <div className="text-xs text-muted-foreground mono mt-0.5">{cfg.label} · {source.host}</div>
      </div>
      {extended && (
        <div className="text-xs text-muted-foreground mono text-right">
          <div>{source.records.toLocaleString()} строк</div>
          <div className="mt-0.5">{source.lastSync}</div>
        </div>
      )}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
        <span className="text-xs" style={{ color: statusColor }}>{statusLabel}</span>
      </div>
      {extended && (
        <div className="flex gap-1 shrink-0">
          <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Icon name="RefreshCw" size={14} />
          </button>
          <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Icon name="Settings2" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}