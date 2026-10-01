#!/bin/sh
# Cadangan Postgres harian. Berkas selalu terenkripsi: /backups/takaran-YYYYMMDD-HHMMSS.sql.gz.enc.
# Cadangan lama dihapus setelah
# BACKUP_KEEP_DAYS hari. Cadangan HARUS disalin ke luar server; lihat docs/deploy.md.
set -eu
set -o pipefail
umask 077

if [ -z "${BACKUP_PASSPHRASE:-}" ]; then
  echo "BACKUP_PASSPHRASE wajib diisi." >&2
  exit 1
fi

KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"

while true; do
  stamp="$(date +%Y%m%d-%H%M%S)"
  file="/backups/takaran-${stamp}.sql.gz"
  if pg_dump --no-owner | gzip -9 > "${file}.tmp" && \
    openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_PASSPHRASE \
      -in "${file}.tmp" -out "${file}.enc.tmp" && \
    mv "${file}.enc.tmp" "${file}.enc" && \
    rm -f "${file}.tmp"; then
    echo "cadangan terenkripsi: ${file}.enc"
    find /backups -name 'takaran-*.sql.gz*' -mtime "+${KEEP_DAYS}" -delete
  else
    rm -f "${file}.tmp" "${file}.enc.tmp"
    echo "cadangan GAGAL pada ${stamp}; backup lama tidak dihapus" >&2
  fi
  sleep 86400
done
