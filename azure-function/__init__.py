"""
Azure Function (HttpTrigger) — generic SQL read API for EEC.

Deployment:
  Zip the contents of this `azure-function/` folder (with __init__.py,
  function.json, host.json, requirements.txt) and deploy to your
  Azure Function App (Python 3.11, Linux runtime).

CORS note:
  Azure Functions do NOT auto-send CORS headers. We set them explicitly on
  every response below, including OPTIONS preflight. You can ALSO enable CORS
  in the Portal (Function App → API → CORS) for a second layer of safety.
"""

import os
import json
import logging
import pyodbc
import azure.functions as func


# ─── Safety whitelist ───────────────────────────────────────────────────────
# The `?path=` query param is mapped straight to a table/view name, so we MUST
# restrict it to an allow-list. Anything not here returns 400.
# Add MORE table/view names here as your schema grows.
ALLOWED_PATHS = {
    "accounts": "accounts",
    "invoices": "invoices",
    "customers": "customers",
    # "lobs": "lobs",
    # "sites": "sites",
    # "roles": "roles",
}

# CORS — replace "*" with your Static Web App domain for tighter security.
# Example: "https://zealous-coast-018453310.azurestaticapps.net"
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")


def _cors_headers() -> dict:
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
    }


def _json_response(status: int, body: dict) -> func.HttpResponse:
    """Return a JSON HttpResponse that already carries CORS headers."""
    return func.HttpResponse(
        body=json.dumps(body, default=str),
        status_code=status,
        mimetype="application/json",
        headers=_cors_headers(),
    )


def _get_connection_string() -> str:
    """Build a pyodbc connection string from environment variables."""
    server = os.environ.get("SQL_SERVER")
    database = os.environ.get("SQL_DATABASE")
    user = os.environ.get("SQL_USER")
    password = os.environ.get("SQL_PASSWORD")

    if not all([server, database, user, password]):
        raise RuntimeError(
            "Missing one or more SQL environment variables: "
            "SQL_SERVER, SQL_DATABASE, SQL_USER, SQL_PASSWORD"
        )

    # ODBC Driver 18 is the recommended driver on Azure (TLS enforced).
    driver = "{ODBC Driver 18 for SQL Server}"
    return (
        f"DRIVER={driver};"
        f"SERVER=tcp:{server};"
        f"PORT=1433;"
        f"DATABASE={database};"
        f"UID={user};"
        f"PWD={password};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
        f"Connection Timeout=30;"
    )


def _query_table(table_name: str, limit: int = 1000) -> list:
    """Run `SELECT TOP (N) * FROM <table>` and return rows as list of dicts."""
    conn_str = _get_connection_string()
    # pyodbc default cursor returns tuples. We use it with a dict-like row class.
    conn = pyodbc.connect(conn_str, timeout=15)
    try:
        cur = conn.cursor()
        # Parameterised TOP is not allowed in pyodbc for SQL Server, so we
        # interpolate an int we control (never user input) — safe.
        sql = f"SELECT TOP ({int(limit)}) * FROM [{table_name}]"
        cur.execute(sql)
        columns = [column[0] for column in cur.description]
        rows = [dict(zip(columns, row)) for row in cur.fetchall()]
        # Cast non-JSON-serialisable types (datetime, Decimal) to strings.
        serialisable = []
        for r in rows:
            serialisable.append({
                k: v.isoformat() if hasattr(v, "isoformat") else (float(v) if hasattr(v, "__float__") and not isinstance(v, bool) else (int(v) if isinstance(v, bool) else v))
                for k, v in r.items()
            })
        return serialisable
    finally:
        conn.close()


def main(req: func.HttpRequest) -> func.HttpResponse:
    """Entry point. Dispatches on `?path=` parameter."""

    # 1. Preflight — browser CORS handshake.
    if req.method == "OPTIONS":
        return func.HttpResponse(
            status_code=204,
            headers=_cors_headers(),
        )

    # 2. Only allow GET for read operations.
    if req.method != "GET":
        return _json_response(405, {"error": "Method not allowed. Use GET."})

    # 3. Resolve and validate the `path` parameter.
    path_value = (req.params.get("path") or "").strip().lower()

    if not path_value:
        return _json_response(400, {
            "error": "Missing 'path' query parameter.",
            "allowed": sorted(ALLOWED_PATHS.keys()),
        })

    table_name = ALLOWED_PATHS.get(path_value)
    if not table_name:
        return _json_response(400, {
            "error": f"'{path_value}' is not a permitted table.",
            "allowed": sorted(ALLOWED_PATHS.keys()),
        })

    # 4. Execute query with robust error handling.
    try:
        rows = _query_table(table_name)
        return _json_response(200, rows)  # Always returns a JSON array
    except RuntimeError as env_err:
        # Configuration issue — return 500 but never leak the secret.
        logging.error("SQL configuration error: %s", env_err)
        return _json_response(500, {
            "error": "Server configuration error. Contact the administrator.",
        })
    except pyodbc.Error as sql_err:
        # Connection failure, permission denied, timeout, etc.
        logging.error("SQL error querying '%s': %s", table_name, sql_err)
        return _json_response(502, {
            "error": f"Database error while querying '{table_name}'.",
        })
    except Exception as exc:  # noqa: BLE001 — last-resort fallback
        logging.exception("Unexpected error for path='%s': %s", path_value, exc)
        return _json_response(500, {
            "error": "An unexpected server error occurred.",
        })
