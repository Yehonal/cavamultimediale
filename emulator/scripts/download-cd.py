#!/usr/bin/env python3
"""Download and verify the public reference copy of the Cava Multimediale CD."""

import argparse
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import sys
import tempfile
from urllib.parse import urljoin, urlparse

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


SOURCE_URL = "https://drive.google.com/uc?export=download&id=0B8vXUyM07TrCOE51bkNWT25nS00&resourcekey=0-dhLYmzRmNSpYnWd3oc7TZw"
EXPECTED_SIZE = 645_816_320
EXPECTED_SHA256 = "f8cfdc7753c9d712750f13a2d4f60f6e6ff3796673b9342876d07f2dff284704"
STREAM_CHUNK_SIZE = 8 * 1024 * 1024


class DownloadForm(HTMLParser):
  def __init__(self) -> None:
    super().__init__()
    self.action: str | None = None
    self.method = "get"
    self.fields: dict[str, str] = {}
    self.active = False

  def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
    attributes = dict(attrs)
    if tag == "form" and attributes.get("id") == "download-form":
      self.active = True
      self.action = attributes.get("action")
      self.method = (attributes.get("method") or "get").lower()
    if tag == "input" and self.active and attributes.get("name"):
      self.fields[attributes["name"]] = attributes.get("value") or ""

  def handle_endtag(self, tag: str) -> None:
    if tag == "form":
      self.active = False


def verify_file(path: Path) -> None:
  if path.stat().st_size != EXPECTED_SIZE:
    raise ValueError(f"CD size mismatch: expected {EXPECTED_SIZE}, got {path.stat().st_size}")
  digest = hashlib.sha256()
  with path.open("rb") as disk:
    while block := disk.read(STREAM_CHUNK_SIZE):
      digest.update(block)
  if digest.hexdigest() != EXPECTED_SHA256:
    raise ValueError(f"CD SHA-256 mismatch: {digest.hexdigest()}")


def download_response(session: requests.Session) -> requests.Response:
  url = SOURCE_URL
  fields = None
  for _ in range(4):
    response = session.get(url, params=fields, stream=True, timeout=(30, 120))
    try:
      response.raise_for_status()
      content_type = response.headers.get("Content-Type", "").lower()
      if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
        return response
      html_parts = []
      html_size = 0
      for part in response.iter_content(chunk_size=64 * 1024):
        html_size += len(part)
        if html_size > 2 * 1024 * 1024:
          raise ValueError("The download confirmation page is unexpectedly large")
        html_parts.append(part)
      form = DownloadForm()
      form.feed(b"".join(html_parts).decode(response.encoding or "utf-8", errors="replace"))
      if not form.action or form.method != "get":
        raise ValueError("Google Drive did not provide a public download form; no CD was downloaded")
      url = urljoin(response.url, form.action)
      parsed = urlparse(url)
      if parsed.scheme != "https" or parsed.hostname not in {"drive.google.com", "drive.usercontent.google.com", "docs.google.com"}:
        raise ValueError("Unexpected download form destination")
      fields = form.fields
    except Exception:
      response.close()
      raise
    response.close()
  raise ValueError("Google Drive kept returning confirmation pages instead of the CD")


def download_cd(destination: Path) -> bool:
  if destination.exists():
    verify_file(destination)
    return False
  destination.parent.mkdir(parents=True, exist_ok=True)
  temporary_path: Path | None = None
  try:
    with requests.Session() as session:
      retries = Retry(total=4, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504], allowed_methods=["GET"])
      session.mount("https://", HTTPAdapter(max_retries=retries))
      with download_response(session) as response:
        digest = hashlib.sha256()
        downloaded = 0
        with tempfile.NamedTemporaryFile(prefix=f".{destination.name}-", suffix=".part", dir=destination.parent, delete=False) as output:
          temporary_path = Path(output.name)
          for block in response.iter_content(chunk_size=STREAM_CHUNK_SIZE):
            if not block:
              continue
            downloaded += len(block)
            if downloaded > EXPECTED_SIZE:
              raise ValueError("Download is larger than the reference CD")
            output.write(block)
            digest.update(block)
            if downloaded % (32 * 1024 * 1024) == 0:
              print(f"Downloaded {downloaded:,}/{EXPECTED_SIZE:,} bytes", file=sys.stderr, flush=True)
        if downloaded != EXPECTED_SIZE:
          raise ValueError(f"CD size mismatch: expected {EXPECTED_SIZE}, got {downloaded}")
        if digest.hexdigest() != EXPECTED_SHA256:
          raise ValueError(f"CD SHA-256 mismatch: {digest.hexdigest()}")
        os.replace(temporary_path, destination)
    return True
  finally:
    if temporary_path is not None:
      temporary_path.unlink(missing_ok=True)


def main() -> int:
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument("--output", type=Path, required=True, help="Destination for the verified CAVA.iso")
  args = parser.parse_args()
  try:
    downloaded = download_cd(args.output)
  except (OSError, ValueError, requests.RequestException) as error:
    print(f"CD download failed: {error}", file=sys.stderr)
    return 1
  print(json.dumps({"output": str(args.output.absolute()), "downloaded": downloaded, "size": EXPECTED_SIZE, "sha256": EXPECTED_SHA256}, indent=2))
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
