#!/usr/bin/env bash
set -euo pipefail
: "${CERN_USER:?Missing CERN_USER}"
: "${CERN_PASSWORD:?Missing CERN_PASSWORD}"
: "${EOS_PATH:?Missing EOS_PATH}"
: "${CERN_WEB_URL:?Set the public HTTPS site URL in the production environment}"
: "${RELEASE:?Missing release identifier}"
fail() { echo "$1" >&2; exit 1; }
[[ "$CERN_USER" =~ ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ ]] || fail 'Invalid CERN_USER format.'
EOS_PATH="${EOS_PATH%/}"
# Restrict destructive mirror operations to a website directory, never an EOS account root.
[[ "$EOS_PATH" =~ ^/eos/(user|project)/[a-zA-Z0-9]/[a-zA-Z0-9_-]+/www(/[a-zA-Z0-9_-]+)*$ ]] || fail 'EOS_PATH must be an EOS website directory.'
[[ "$RELEASE" =~ ^[0-9]+-[a-f0-9]{40}$ ]] || fail 'Invalid RELEASE format.'
[[ "$CERN_WEB_URL" =~ ^https://[a-zA-Z0-9.-]+\.web\.cern\.ch/?$ ]] || fail 'Invalid CERN_WEB_URL format.'
[[ -f dist/index.html && -f dist/.htaccess && -f dist/_headers ]] || fail 'Missing required website artifacts in dist/.'
publication_mode=full
if [[ -f dist/.publication-mode ]]; then publication_mode=$(cat dist/.publication-mode); fi
case "$publication_mode" in
  coming-soon) [[ -f dist/coming-soon.css && ! -f dist/AJ_Wildridge_CV.pdf ]] || fail 'Invalid coming-soon artifact.' ;;
  full) [[ -f dist/AJ_Wildridge_CV.pdf ]] || fail 'Missing CV in full-site artifact.' ;;
  *) fail 'Unknown publication mode.' ;;
esac
export RCLONE_CONFIG=/dev/null
export RCLONE_CONFIG_CERN_TYPE=webdav
export RCLONE_CONFIG_CERN_VENDOR=other
export RCLONE_CONFIG_CERN_URL="https://cernbox.cern.ch/cernbox/webdav$EOS_PATH/"
export RCLONE_CONFIG_CERN_USER="$CERN_USER"
# rclone requires an obscured password; stdin keeps it out of command arguments.
obscured_password=$(printf '%s\n' "$CERN_PASSWORD" | rclone obscure -)
export RCLONE_CONFIG_CERN_PASS="$obscured_password"
unset obscured_password
unset CERN_PASSWORD
work=$(mktemp -d)
stage="cern:_deploy/$RELEASE"
stage_started=false
backup_ready=false
production_touched=false
transfer() {
  rclone "$@" --contimeout 15s --timeout 30s --retries 2 --low-level-retries 2
}
publish() {
  # Excluded staging content is protected from sync's destination deletion.
  transfer sync "$1" cern: --exclude '/_deploy/**' --create-empty-src-dirs --ignore-times
}
cleanup() {
  status=$?
  if [[ "$status" -ne 0 && "$backup_ready" == true && "$production_touched" == true ]]; then
    echo 'Deployment failed; restoring the previous website.' >&2
    publish "$work/backup/" || echo 'Automatic restore failed; the backup artifact must be restored manually.' >&2
  fi
  if [[ "$stage_started" == true ]]; then transfer purge "$stage/" || true; fi
  # Preserve a recoverable backup on a failed update for the artifact upload step.
  if [[ "$status" -ne 0 && "$backup_ready" == true ]]; then tar -C "$work/backup" -czf cern-rollback.tar.gz .; fi
  rm -rf "$work"
  unset RCLONE_CONFIG_CERN_PASS
  exit "$status"
}
trap cleanup EXIT
if ! transfer lsf cern: --max-depth 1 > /dev/null; then
  echo 'Cannot access the website directory through CERNBox WebDAV. Run Diagnose CERN EOS access and check CERN_USER, CERN_PASSWORD, and EOS_PATH.' >&2
  exit 1
fi
mkdir -p "$work/probe" "$work/backup"
printf '%s\n' '<!doctype html><html lang="en"><head><title>Deployment check</title></head><body><h1>Deployment header check</h1></body></html>' > "$work/probe/index.html"
cp dist/.htaccess "$work/probe/.htaccess"
# Verify the actual Apache header policy on a harmless probe before publishing the site.
stage_started=true
transfer copy "$work/probe/" "$stage/" --create-empty-src-dirs
node scripts/validate-security-headers.js "${CERN_WEB_URL%/}/_deploy/$RELEASE/" --root-only
transfer copy cern: "$work/backup/" --exclude '/_deploy/**'
backup_ready=true
production_touched=true
publish dist/
if [[ "$publication_mode" == coming-soon ]]; then
  node scripts/validate-security-headers.js "$CERN_WEB_URL" --root-only
  node scripts/check-coming-soon.js "${CERN_WEB_URL%/}/"
else
  node scripts/validate-security-headers.js "$CERN_WEB_URL"
fi
echo 'CERN publication and security-header verification passed.'
