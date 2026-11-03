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
[[ -f dist/index.html && -f dist/.htaccess && -f dist/AJ_Wildridge_CV.pdf ]] || fail 'Missing required website artifacts in dist/.'
export LFTP_PASSWORD="$CERN_PASSWORD"
unset CERN_PASSWORD
work=$(mktemp -d)
# This external WebDAV route accepts the configured CERN account credential.
remote_root="/cernbox/webdav$EOS_PATH"
stage="$remote_root/_deploy/$RELEASE"
stage_started=false
backup_ready=false
production_touched=false
transfer() {
  lftp --env-password -u "$CERN_USER" https://cernbox.cern.ch <<LFTP
set cmd:fail-exit yes
set net:timeout 30
set net:max-retries 2
set ssl:verify-certificate yes
set http:use-propfind yes
set http:use-allprop yes
set http:use-mkcol yes
set http:cache no
set mirror:set-permissions no
$1
bye
LFTP
}
cleanup() {
  status=$?
  if [[ "$status" -ne 0 && "$backup_ready" == true && "$production_touched" == true ]]; then
    echo 'Deployment failed; restoring the previous website.' >&2
    transfer "mirror -R --delete --exclude-glob _deploy/ '$work/backup/' '$remote_root/'" || echo 'Automatic restore failed; the backup artifact must be restored manually.' >&2
  fi
  if [[ "$stage_started" == true ]]; then transfer "rm -r '$stage'" || true; fi
  # Preserve a recoverable backup on a failed update for the artifact upload step.
  if [[ "$status" -ne 0 && "$backup_ready" == true ]]; then tar -C "$work/backup" -czf cern-rollback.tar.gz .; fi
  rm -rf "$work"
  unset LFTP_PASSWORD
  exit "$status"
}
trap cleanup EXIT
if ! transfer "cls -l '$remote_root/' > /dev/null"; then
  echo 'Cannot access the website directory through CERNBox WebDAV. Run Diagnose CERN EOS access and check CERN_USER, CERN_PASSWORD, and EOS_PATH.' >&2
  exit 1
fi
mkdir -p "$work/probe" "$work/backup"
printf '%s\n' '<!doctype html><html lang="en"><head><title>Deployment check</title></head><body><h1>Deployment header check</h1></body></html>' > "$work/probe/index.html"
cp dist/.htaccess "$work/probe/.htaccess"
# Verify the actual Apache header policy on a harmless probe before publishing the site.
stage_started=true
transfer "mkdir -p '$stage'
mirror -R '$work/probe/' '$stage/'"
node scripts/validate-security-headers.js "${CERN_WEB_URL%/}/_deploy/$RELEASE/" --root-only
transfer "mirror --exclude-glob _deploy/ '$remote_root/' '$work/backup/'"
backup_ready=true
production_touched=true
transfer "mirror -R --delete --exclude-glob _deploy/ 'dist/' '$remote_root/'"
node scripts/validate-security-headers.js "$CERN_WEB_URL"
echo 'CERN publication and security-header verification passed.'
