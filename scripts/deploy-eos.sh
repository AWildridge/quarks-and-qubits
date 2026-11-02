#!/usr/bin/env bash
set -euo pipefail
: "${CERN_USER:?Missing CERN_USER}"
: "${CERN_PASSWORD:?Missing CERN_PASSWORD}"
: "${EOS_PATH:?Missing EOS_PATH}"
: "${CERN_WEB_URL:?Set the public HTTPS site URL in the production environment}"
: "${RELEASE:?Missing release identifier}"
[[ "$CERN_USER" =~ ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ ]]
# Restrict destructive mirror operations to a website directory, never an EOS account root.
[[ "$EOS_PATH" =~ ^/eos/(user|project)/[a-zA-Z0-9]/[a-zA-Z0-9_-]+/www(/[a-zA-Z0-9_-]+)*$ ]]
[[ "$RELEASE" =~ ^[0-9]+-[a-f0-9]{40}$ ]]
[[ "$CERN_WEB_URL" =~ ^https://[a-zA-Z0-9.-]+\.web\.cern\.ch/?$ ]]
[[ -f dist/index.html && -f dist/.htaccess && -f dist/AJ_Wildridge_CV.pdf ]]
export LFTP_PASSWORD="$CERN_PASSWORD"
unset CERN_PASSWORD
work=$(mktemp -d)
stage="$EOS_PATH/_deploy/$RELEASE"
backup_ready=false
production_touched=false
transfer() {
  lftp --env-password -u "$CERN_USER" https://eosproject-http.cern.ch <<LFTP
set cmd:fail-exit yes
set net:timeout 30
set net:max-retries 2
set ssl:verify-certificate yes
$1
bye
LFTP
}
cleanup() {
  status=$?
  if [[ "$status" -ne 0 && "$backup_ready" == true && "$production_touched" == true ]]; then
    echo 'Deployment failed; restoring the previous website.' >&2
    transfer "mirror -R --delete --exclude-glob _deploy/ '$work/backup/' '$EOS_PATH/'" || echo 'Automatic restore failed; the backup artifact must be restored manually.' >&2
  fi
  transfer "rm -r '$stage'" || true
  # Preserve a recoverable backup on a failed update for the artifact upload step.
  if [[ "$status" -ne 0 && "$backup_ready" == true ]]; then tar -C "$work/backup" -czf cern-rollback.tar.gz .; fi
  rm -rf "$work"
  unset LFTP_PASSWORD
  exit "$status"
}
trap cleanup EXIT
mkdir -p "$work/probe" "$work/backup"
printf '%s\n' '<!doctype html><html lang="en"><head><title>Deployment check</title></head><body><h1>Deployment header check</h1></body></html>' > "$work/probe/index.html"
cp dist/.htaccess "$work/probe/.htaccess"
# Verify the actual Apache header policy on a harmless probe before publishing the site.
transfer "mkdir -p '$stage'
mirror -R '$work/probe/' '$stage/'"
node scripts/validate-security-headers.js "${CERN_WEB_URL%/}/_deploy/$RELEASE/" --root-only
transfer "mirror --exclude-glob _deploy/ '$EOS_PATH/' '$work/backup/'"
backup_ready=true
production_touched=true
transfer "mirror -R --delete --exclude-glob _deploy/ 'dist/' '$EOS_PATH/'"
node scripts/validate-security-headers.js "$CERN_WEB_URL"
echo 'CERN publication and security-header verification passed.'
