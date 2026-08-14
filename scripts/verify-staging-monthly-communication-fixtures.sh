#!/usr/bin/env sh
set -eu

run_query_file() {
  label="$1"
  file="$2"

  docker exec -i "${SUPABASE_DB_CONTAINER:-supabase_db_Dashbord}" \
    psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < "$file" >/dev/null
  printf 'ok - %s\n' "$label"
}

cleanup() {
  docker exec -i "${SUPABASE_DB_CONTAINER:-supabase_db_Dashbord}" \
    psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - \
    < supabase/fixtures/staging-monthly-communication-demo.rollback.sql >/dev/null 2>&1 || true
  docker exec -i "${SUPABASE_DB_CONTAINER:-supabase_db_Dashbord}" \
    psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - \
    < supabase/fixtures/staging-dashboard-read-demo.local-cleanup.sql >/dev/null 2>&1 || true
}

trap cleanup EXIT

run_query_file "prepare local staging base records" supabase/fixtures/staging-dashboard-read-demo.local-setup.sql
run_query_file "apply monthly communication fixture" supabase/fixtures/staging-monthly-communication-demo.sql
run_query_file "verify monthly communication fixture" supabase/fixtures/staging-monthly-communication-demo.verify.sql
run_query_file "rerun monthly communication fixture idempotently" supabase/fixtures/staging-monthly-communication-demo.sql
run_query_file "verify idempotent monthly communication fixture" supabase/fixtures/staging-monthly-communication-demo.verify.sql
run_query_file "apply monthly communication fixture rollback" supabase/fixtures/staging-monthly-communication-demo.rollback.sql
run_query_file "verify monthly communication fixture rollback" supabase/fixtures/staging-monthly-communication-demo.verify-rollback.sql

trap - EXIT
cleanup

printf 'staging monthly communication fixture verification passed\n'
