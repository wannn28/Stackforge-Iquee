#!/usr/bin/env bash
# Create a self-signed origin certificate for Cloudflare SSL mode "Full".
# Writes deploy/certs/origin.crt and origin.key. Refuses to overwrite.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
crt="${root}/certs/origin.crt"
key="${root}/certs/origin.key"

mkdir -p "${root}/certs"

if [[ -e "${crt}" || -e "${key}" ]]; then
  echo "Refusing to overwrite existing ${crt} or ${key}." >&2
  exit 1
fi

openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
  -keyout "${key}" \
  -out "${crt}" \
  -subj "/CN=stackforge.iquee.tech" \
  -addext "subjectAltName=DNS:stackforge.iquee.tech"

chmod 600 "${key}"
echo "Wrote ${crt} and ${key}."
echo "Mount these into nginx. They are gitignored. Cloudflare Full accepts this self-signed origin cert."
