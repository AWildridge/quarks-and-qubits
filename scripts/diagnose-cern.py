#!/usr/bin/env python3
"""Check CERN WebDAV access without changing remote files or logging secrets."""

import base64
import http.client
import os
import re
import socket
import ssl
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def probe(host, path, authorization):
    connection = http.client.HTTPSConnection(host, timeout=15)
    try:
        connection.request(
            "PROPFIND",
            path,
            body=b'<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/></d:prop></d:propfind>',
            headers={
                "Authorization": authorization,
                "Depth": "0",
                "Content-Type": "application/xml",
            },
        )
        response = connection.getresponse()
        status = response.status
        if status == 207:
            try:
                root = ET.fromstring(response.read(1024 * 1024))
                readable = any(
                    re.search(r"\s200(?:\s|$)", item.text or "")
                    for item in root.findall(".//{DAV:}status")
                )
            except ET.ParseError:
                readable = False
            return readable, "HTTP 207; " + (
                "directory metadata is readable" if readable else "no successful DAV property response"
            )
        meanings = {
            401: "authentication rejected; credentials or authentication policy",
            403: "access forbidden; check account policy and directory permissions",
            404: "directory or endpoint not found",
            405: "WebDAV method not allowed",
        }
        # Never follow redirects with the Authorization header.
        detail = "redirect refused" if 300 <= status < 400 else meanings.get(status, "unexpected response")
        return False, f"HTTP {status}; {detail}"
    except socket.gaierror:
        return False, "DNS lookup failed; endpoint may require the CERN network"
    except (TimeoutError, socket.timeout):
        return False, "connection timed out; endpoint may require the CERN network"
    except ssl.SSLError:
        return False, "TLS verification or handshake failed"
    except (OSError, http.client.HTTPException):
        # Exception messages can contain request details; report only a fixed description.
        return False, "connection failed"
    finally:
        connection.close()


def main():
    required = ("CERN_USER", "CERN_PASSWORD", "EOS_PATH")
    if any(not os.environ.get(name) for name in required):
        print("Missing one or more required secrets: CERN_USER, CERN_PASSWORD, EOS_PATH.")
        return 1
    user = os.environ["CERN_USER"]
    path = os.environ["EOS_PATH"].rstrip("/")
    if not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_-]*", user) or not re.fullmatch(
        r"/eos/(user|project)/[a-zA-Z0-9]/[a-zA-Z0-9_-]+/www(/[a-zA-Z0-9_-]+)*", path
    ):
        print("CERN_USER or EOS_PATH has an invalid format; values were not printed.")
        return 1
    credential = base64.b64encode(f"{user}:{os.environ['CERN_PASSWORD']}".encode()).decode()
    endpoints = (
        ("Current deployment route", "cernbox.cern.ch", f"/remote.php/dav/files/{user}{path}/"),
        ("Documented external WebDAV route", "cernbox.cern.ch", f"/cernbox/webdav{path}/"),
        ("Documented CERN-network API route", "api.cernbox.cern.ch", f"/remote.php/dav/files/{user}{path}/"),
    )
    lines = ["CERN access diagnostics: read-only PROPFIND requests; no remote files changed."]
    successes = []
    for label, host, remote in endpoints:
        readable, result = probe(host, remote, "Basic " + credential)
        lines.append(f"{label} ({host}): {result}.")
        if readable:
            successes.append(label)
    lines.append("Directory metadata access does not establish upload or delete permission.")
    if successes:
        lines.append("Readable routes: " + ", ".join(successes) + ".")
    else:
        lines.append("No route accepted directory access. Compare with a test from lxplus or contact CERNBox support.")
    report = "\n\n".join(lines) + "\n"
    print(report, end="")
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with Path(os.environ["GITHUB_STEP_SUMMARY"]).open("a") as summary:
            summary.write(report)
    return 0 if successes else 1


if __name__ == "__main__":
    sys.exit(main())
