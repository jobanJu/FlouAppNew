#!/usr/bin/env bash
set -euo pipefail

# Usage: export SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN (or SUPABASE_SERVICE_ROLE_KEY)
# then run: ./scripts/supabase_deploy.sh

if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "SUPABASE_PROJECT_REF is not set. Export it and retry."
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found — installing..."
  ARCH="$(uname -m)"
  ASSET="linux_x86_64"
  if [ "$ARCH" = "aarch64" ]; then ASSET="linux_arm64"; fi
  URL=$(curl -s https://api.github.com/repos/supabase/cli/releases/latest | grep browser_download_url | grep "$ASSET" | cut -d '"' -f 4)
  curl -sL "$URL" -o supabase.tar.gz
  tar -xzf supabase.tar.gz
  sudo mv supabase /usr/local/bin/
  rm supabase.tar.gz
fi

echo "Pushing DB schema to project: $SUPABASE_PROJECT_REF"
supabase db push --project-ref "$SUPABASE_PROJECT_REF"

if [ -d "supabase/functions" ]; then
  echo "Deploying functions..."
  for d in supabase/functions/*/ ; do
    fn=$(basename "$d")
    echo "Deploying $fn"
    supabase functions deploy "$fn" --project-ref "$SUPABASE_PROJECT_REF"
  done
else
  echo "No supabase/functions directory found — skipping functions deploy."
fi

echo "Done."
