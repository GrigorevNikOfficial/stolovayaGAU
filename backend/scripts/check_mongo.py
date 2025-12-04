"""Simple MongoDB connectivity check using pymongo.

Loads MONGODB_URI from the backend .env file (if present) or falls back to
an environment variable. Prints ping result and exits with non-zero code on
failure.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError
except ImportError:
    print("pymongo is not installed. Install it via 'pip install pymongo' and retry.")
    sys.exit(1)

ROOT_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT_DIR / ".env"


def load_env_value(key: str) -> str | None:
    value = os.getenv(key)
    if value:
        return value

    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            k, v = line.split("=", 1)
            if k.strip() == key:
                return v.strip()
    return None


def main() -> int:
    uri = load_env_value("MONGODB_URI")
    if not uri:
        print("MONGODB_URI is not configured.")
        return 1

    print(f"Connecting to MongoDB via: {uri}")
    try:
        with MongoClient(uri, serverSelectionTimeoutMS=5000) as client:
            result = client.admin.command("ping")
            print("Ping response:", result)
        print("MongoDB connection successful.")
        return 0
    except PyMongoError as exc:
        print("MongoDB connection failed:", exc)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
