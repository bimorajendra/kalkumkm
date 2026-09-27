#!/bin/sh
# Cadangan Postgres harian. Berkas: /backups/takaran-YYYYMMDD-HHMMSS.sql.gz
# (ditambah .enc bila BACKUP_PASSPHRASE diisi). Cadangan lama dihapus setelah
# BACKUP_KEEP_DAYS hari. Cadangan HARUS disalin ke luar server; lihat docs/deploy.md.
set -eu

KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"

while true; do
  stamp="$(date +%Y%m%d-%H%M%S)"
  file="/backups/takaran-${stamp}.sql.gz"
  if pg_dump --no-owner | gzip -9 > "${file}.tmp"; then
    if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
      openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_PASSPHRASE \
        -in "${file}.tmp" -out "${file}.enc"
      rm -f "${file}.tmp"
      echo "cadangan terenkripsi: ${file}.enc"
    else
      mv "${file}.tmp" "${file}"
      echo "cadangan: ${file}"
    fi
  else
    rm -f "${file}.tmp"
    echo "cadangan GAGAL pada ${stamp}" >&2
  fi
  find /backups -name 'takaran-*.sql.gz*' -mtime "+${KEEP_DAYS}" -delete
  sleep 86400
done
