# Oman Photo — Deploy & Production Cutover

Production runs **two Next.js containers** (`web-blue` on `127.0.0.1:3001` and
`web-green` on `127.0.0.1:3002`). Nginx points at exactly one of them at a time.
The active slot is recorded in `/root/omanphoto/.active-slot`.

The thing that decides which slot is live is the included file:

```
include /root/omanphoto/docker/nginx-upstream-generated.conf;
```

That file is rewritten by `scripts/zero-downtime-deploy.sh` from
`docker/nginx.upstream.active.template`. **Never hardcode a port in the nginx
site config** (`/etc/nginx/sites-enabled/omanphoto`). If you do, deploys will
silently keep serving stale builds.

## Deploy commands

There is exactly one supported production command:

```bash
cd /root/omanphoto
npm run deploy:clean
# or: bash scripts/clean-full-redeploy.sh
```

It runs all of these and **fails loudly** if any step is wrong:

1. `docker compose down` (volumes preserved)
2. `git fetch && git merge --autostash origin/main`
3. `docker compose build --no-cache web-blue web-green` with `NEXT_PUBLIC_BUILD_ID` set to the new git sha
4. Wait for `db` healthy
5. `prisma-safe.sh migrate deploy`
6. (optional) `npm run db:seed` if `OMANPHOTO_RUN_DB_SEED=1`
7. Start `db + web-blue + web-green`; force-stop the legacy CI `web` container if it is running
8. `scripts/check-env.sh`
9. Wait both slots ready, smoke `/en/services` and `/en/ai-studio`, and **assert each slot serves `build:<new-sha>`**
10. `scripts/zero-downtime-deploy.sh` — builds the inactive slot one more time (idempotent), runs migrate again, swaps `nginx-upstream-generated.conf` to the new port, reloads nginx, fetches `https://omanphoto.com/en/ai-studio` to confirm
11. **Public marker assertion** — fetches `https://omanphoto.com/en` and fails if the served `build:<sha>` is not the new one

If any step fails the script aborts and the previous slot keeps serving traffic.

## After every deploy

Always run:

```bash
bash /root/omanphoto/scripts/verify-prod-build.sh
```

It compares the public site's `build:<sha>` marker against the active slot's
marker and fails if they disagree. Wire it into cron / monitoring:

```cron
*/5 * * * * /root/omanphoto/scripts/verify-prod-build.sh >> /var/log/omanphoto-verify.log 2>&1
```

## Why the previous deploys failed silently

- `/etc/nginx/sites-enabled/omanphoto` had a hardcoded `upstream omanphoto_app { server 127.0.0.1:3000; ... }`.
- The legacy CI `web` container (port 3000, `profiles: ["ci"]`) was left running.
- `scripts/clean-full-redeploy.sh` rebuilt blue/green but never touched nginx, so production stayed on the stale container.

All three are now fixed:

- nginx site reads the slot from `nginx-upstream-generated.conf` and uses upstream name `omanphoto_web`.
- `clean-full-redeploy.sh` calls `zero-downtime-deploy.sh` and fails if the public marker doesn't match the new build.
- The legacy `web` container is removed, and the deploy script stops it again on every run.

## Recovering from 502 (containers stopped mid-deploy)

If you abort `clean-full-redeploy.sh` after Step 1 (`docker compose down`) but before
Step 7 (`docker compose up -d`), every container will be stopped and `omanphoto.com`
will return **502 Bad Gateway** (nginx has no upstream to talk to).

Recovery is one command — it brings the existing built images back up:

```bash
cd /root/omanphoto/docker && docker compose up -d db web-blue web-green
# wait ~15 seconds for migrate + next start
bash /root/omanphoto/scripts/verify-prod-build.sh
```

If that doesn't get you back to 200, run the full deploy again (and let it finish):

```bash
cd /root/omanphoto && npm run deploy:clean
```

## Rolling back

The previous slot is left stopped, not removed. To roll back:

```bash
cd /root/omanphoto/docker
prev=$(cat /root/omanphoto/.previous-slot)   # blue or green
case "$prev" in
  blue)  port=3001 ;;
  green) port=3002 ;;
esac

docker compose up -d "web-${prev}"
sed "s/__PORT__/${port}/g" /root/omanphoto/docker/nginx.upstream.active.template \
  > /root/omanphoto/docker/nginx-upstream-generated.conf
sudo nginx -t && sudo nginx -s reload
echo "${prev}" > /root/omanphoto/.active-slot
bash /root/omanphoto/scripts/verify-prod-build.sh
```

## Admin password

Production admin password is set from the `ADMIN_PASSWORD` env var when the
container boots (defaults to `admin` per `docker-compose.yml`). To change it
without rebuilding:

```bash
cd /root/omanphoto/docker
docker compose exec -T -e ADMIN_PASSWORD='your-new-password' web-blue \
  bash -lc 'cd /opt/omanphoto/app && npx tsx scripts/reset-admin-password.ts'
```

(swap `web-blue` for whatever the current active slot is — see `.active-slot`.)
