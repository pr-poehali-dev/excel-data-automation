"""
CRUD API для справочников клиентов и товаров.
GET /clients, POST /clients, PUT /clients, DELETE /clients
GET /products, POST /products, PUT /products, DELETE /products
"""

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p4178914_excel_data_automatio")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data):
    return {"statusCode": 200, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    entity = params.get("type", "clients")   # clients | products
    body   = {}
    if event.get("body"):
        body = json.loads(event["body"])

    if entity not in ("clients", "products"):
        return err("type must be 'clients' or 'products'")

    table = f"{SCHEMA}.{entity}"

    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:

            # ── LIST ────────────────────────────────────────────────────────
            if method == "GET":
                cur.execute(f"SELECT * FROM {table} ORDER BY id")
                rows = [dict(r) for r in cur.fetchall()]
                return ok(rows)

            # ── CREATE ───────────────────────────────────────────────────────
            if method == "POST":
                if entity == "clients":
                    cur.execute(
                        f"""INSERT INTO {table}
                            (name, company, email, phone, city, manager, discount)
                            VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
                        (body.get("name",""), body.get("company",""), body.get("email",""),
                         body.get("phone",""), body.get("city",""), body.get("manager",""),
                         float(body.get("discount", 0)))
                    )
                else:
                    cur.execute(
                        f"""INSERT INTO {table}
                            (name, category, unit, price, supplier, sku, stock, vat)
                            VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
                        (body.get("name",""), body.get("category",""), body.get("unit","шт"),
                         float(body.get("price", 0)), body.get("supplier",""), body.get("sku",""),
                         int(body.get("stock", 0)), float(body.get("vat", 20)))
                    )
                conn.commit()
                return ok(dict(cur.fetchone()))

            # ── UPDATE ───────────────────────────────────────────────────────
            if method == "PUT":
                rid = body.get("id")
                if not rid:
                    return err("id required")
                if entity == "clients":
                    cur.execute(
                        f"""UPDATE {table} SET
                            name=%s, company=%s, email=%s, phone=%s,
                            city=%s, manager=%s, discount=%s
                            WHERE id=%s RETURNING *""",
                        (body.get("name",""), body.get("company",""), body.get("email",""),
                         body.get("phone",""), body.get("city",""), body.get("manager",""),
                         float(body.get("discount", 0)), rid)
                    )
                else:
                    cur.execute(
                        f"""UPDATE {table} SET
                            name=%s, category=%s, unit=%s, price=%s,
                            supplier=%s, sku=%s, stock=%s, vat=%s
                            WHERE id=%s RETURNING *""",
                        (body.get("name",""), body.get("category",""), body.get("unit","шт"),
                         float(body.get("price", 0)), body.get("supplier",""), body.get("sku",""),
                         int(body.get("stock", 0)), float(body.get("vat", 20)), rid)
                    )
                conn.commit()
                row = cur.fetchone()
                if not row:
                    return err("not found", 404)
                return ok(dict(row))

            # ── DELETE ───────────────────────────────────────────────────────
            if method == "DELETE":
                rid = body.get("id") or params.get("id")
                if not rid:
                    return err("id required")
                cur.execute(f"DELETE FROM {table} WHERE id=%s RETURNING id", (rid,))
                conn.commit()
                row = cur.fetchone()
                if not row:
                    return err("not found", 404)
                return ok({"deleted": rid})

    return err("method not allowed", 405)
