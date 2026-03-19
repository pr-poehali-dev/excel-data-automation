
CREATE TABLE t_p4178914_excel_data_automatio.clients (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  company    TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  city       TEXT NOT NULL DEFAULT '',
  manager    TEXT NOT NULL DEFAULT '',
  discount   NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p4178914_excel_data_automatio.products (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT '',
  unit       TEXT NOT NULL DEFAULT 'шт',
  price      NUMERIC(15,2) NOT NULL DEFAULT 0,
  supplier   TEXT NOT NULL DEFAULT '',
  sku        TEXT NOT NULL DEFAULT '',
  stock      INTEGER NOT NULL DEFAULT 0,
  vat        NUMERIC(5,2) NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO t_p4178914_excel_data_automatio.clients (name, company, email, phone, city, manager, discount) VALUES
  ('Иванов Алексей',    'ООО Альфа',       'ivanov@alfa.ru',     '+7 (495) 100-01-01', 'Москва',           'Петров К.',  5),
  ('Смирнова Елена',    'ИП Смирнова',     'e.smirnova@mail.ru', '+7 (812) 200-02-02', 'Санкт-Петербург',  'Козлов Д.', 0),
  ('Кузнецов Дмитрий', 'ЗАО Бета Групп',  'd.kuz@beta.ru',      '+7 (343) 300-03-03', 'Екатеринбург',     'Петров К.', 10),
  ('Попова Ирина',      'ООО Гамма',       'popova@gamma.org',   '+7 (383) 400-04-04', 'Новосибирск',      'Лебедев Р.', 3),
  ('Новиков Сергей',    'ПАО Дельта',      'novikov@delta.com',  '+7 (831) 500-05-05', 'Нижний Новгород',  'Козлов Д.', 7),
  ('Морозова Анна',     'ООО Эпсилон',     'morozova@eps.ru',    '+7 (846) 600-06-06', 'Самара',           'Лебедев Р.', 0),
  ('Волков Павел',      'ИП Волков П.А.',  'volkov@inbox.ru',    '+7 (351) 700-07-07', 'Челябинск',        'Петров К.', 2),
  ('Соколова Татьяна',  'ООО Зета Трейд',  'sokolova@zeta.ru',   '+7 (473) 800-08-08', 'Воронеж',          'Козлов Д.', 15);

INSERT INTO t_p4178914_excel_data_automatio.products (name, category, unit, price, supplier, sku, stock, vat) VALUES
  ('Ноутбук Pro 15',      'Электроника', 'шт', 98500,  'TechCorp',    'NB-001', 24,  20),
  ('Офисный стул ErgoX',  'Мебель',      'шт', 18900,  'OfficeWorld', 'CH-042', 56,  20),
  ('Монитор 27 IPS',      'Электроника', 'шт', 32400,  'TechCorp',    'MN-027', 18,  20),
  ('Принтер A4 Laser',    'Оргтехника',  'шт', 22100,  'PrintMaster', 'PR-110', 9,   20),
  ('Клавиатура Mech',     'Периферия',   'шт', 7800,   'GadgetPlus',  'KB-500', 120, 20),
  ('Мышь беспроводная',   'Периферия',   'шт', 3200,   'GadgetPlus',  'MS-220', 85,  20),
  ('Стол письменный 1.4м','Мебель',      'шт', 24000,  'OfficeWorld', 'TB-140', 12,  20),
  ('Сканер документов',   'Оргтехника',  'шт', 14500,  'PrintMaster', 'SC-300', 6,   20),
  ('Веб-камера 4K',       'Электроника', 'шт', 9600,   'TechCorp',    'WC-400', 33,  20),
  ('Наушники ANC',        'Электроника', 'шт', 18200,  'GadgetPlus',  'HP-800', 44,  20);
