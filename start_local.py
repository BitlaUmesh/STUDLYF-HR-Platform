#!/usr/bin/env python3
"""Start the local STUDLYF HR Node backend and Next.js frontend.

The deprecated FastAPI backend is intentionally not started. PostgreSQL is an
external prerequisite configured through backend-node/.env (DATABASE_URL).

Usage:
    py start_local.py
    py start_local.py --check
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time
from dataclasses import dataclass


ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend-node"
FRONTEND_DIR = ROOT / "frontend"
NPM_COMMAND = "npm.cmd" if os.name == "nt" else "npm"


@dataclass(frozen=True)
class Service:
    name: str
    directory: Path
    url: str

    @property
    def command(self) -> list[str]:
        return [NPM_COMMAND, "run", "dev"]


SERVICES = (
    Service("Node backend", BACKEND_DIR, "http://localhost:3001"),
    Service("Next.js frontend", FRONTEND_DIR, "http://localhost:3000"),
)


def preflight() -> list[str]:
    """Return configuration errors before starting persistent processes."""
    errors: list[str] = []

    if shutil.which(NPM_COMMAND) is None:
        errors.append("npm was not found on PATH. Install Node.js 18 or later.")

    backend_env = BACKEND_DIR / ".env"
    if not backend_env.is_file():
        errors.append(
            "backend-node/.env is missing. Copy backend-node/.env.example and "
            "set DATABASE_URL, JWT_SECRET, and JWT_REFRESH_SECRET."
        )

    for service in SERVICES:
        if not service.directory.is_dir():
            errors.append(f"{service.name} directory is missing: {service.directory}")
        elif not (service.directory / "node_modules").is_dir():
            errors.append(
                f"Dependencies are missing for {service.name}. Run `npm install` "
                f"in {service.directory.relative_to(ROOT)} first."
            )

    return errors


def start_service(service: Service) -> subprocess.Popen[object]:
    """Start one npm dev server in its project directory."""
    popen_options: dict[str, object] = {
        "cwd": service.directory,
        "stdin": None,
        "stdout": None,
        "stderr": None,
    }

    if os.name == "nt":
        popen_options["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        popen_options["start_new_session"] = True

    print(f"Starting {service.name}: {' '.join(service.command)}")
    return subprocess.Popen(service.command, **popen_options)


def stop_service(service: Service, process: subprocess.Popen[object]) -> None:
    """Stop the npm process and the dev-server child process it spawned."""
    if process.poll() is not None:
        return

    print(f"Stopping {service.name} (PID {process.pid})...")
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    else:
        os.killpg(process.pid, signal.SIGTERM)

    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Start the STUDLYF HR Node backend and Next.js frontend locally."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="validate prerequisites and print the services without starting them",
    )
    args = parser.parse_args()

    errors = preflight()
    if errors:
        print("Local startup prerequisites are not met:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print("Services managed by this launcher:")
    for service in SERVICES:
        print(f"  - {service.name}: {service.url}")
    print("PostgreSQL is not started by this script; it must be available at DATABASE_URL.")
    print("The deprecated FastAPI backend is intentionally not started.")

    if args.check:
        print("Preflight check passed.")
        return 0

    processes: list[tuple[Service, subprocess.Popen[object]]] = []
    try:
        for service in SERVICES:
            processes.append((service, start_service(service)))

        print("\nBoth services are starting. Open http://localhost:3000 in your browser.")
        print("Press Ctrl+C to stop all services.\n")

        while True:
            for service, process in processes:
                exit_code = process.poll()
                if exit_code is not None:
                    print(
                        f"{service.name} exited unexpectedly with code {exit_code}.",
                        file=sys.stderr,
                    )
                    return exit_code or 1
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nShutdown requested.")
        return 0
    finally:
        for service, process in reversed(processes):
            stop_service(service, process)


if __name__ == "__main__":
    raise SystemExit(main())
