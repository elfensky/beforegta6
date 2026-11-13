# syntax=docker/dockerfile:1
# Static site image (deploy/README.md). CI runs `npm run build` on the runner first; this image only serves dist/.
FROM nginx:1.30-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html
# start-first rollouts gate on this: a task is "running" only once it answers.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
