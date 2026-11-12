#!/bin/bash
set -e

# In CI, docker/setup-buildx-action provides the builder and the GitHub Actions
# cache backend. Locally, create a buildx builder if one doesn't exist yet.
if ! docker buildx inspect buildx-builder >/dev/null 2>&1 && [ -z "$GITHUB_ACTIONS" ]; then
   docker buildx create --name buildx-builder --use
fi
mkdir -p releases/pi/

SECRET_ARGS=""
TOKEN_ENV_NAME=""
if [ -n "$GH_TOKEN" ]; then
  TOKEN_ENV_NAME="GH_TOKEN"
elif [ -n "$GITHUB_TOKEN" ]; then
  TOKEN_ENV_NAME="GITHUB_TOKEN"
fi

if [ -n "$TOKEN_ENV_NAME" ]; then
  SECRET_ARGS="--secret id=GH_TOKEN,env=$TOKEN_ENV_NAME"
fi

# Reuse layers (notably the dependency install) across runs. Every layer after
# `COPY . .` is rebuilt whenever the source changes, so builds stay fresh.
CACHE_ARGS=""
if [ -n "$GITHUB_ACTIONS" ]; then
  CACHE_ARGS="--cache-from type=gha,scope=pi --cache-to type=gha,mode=max,scope=pi"
fi

docker buildx build  -f DockerfilePi . \
   --platform linux/arm64 \
   --target=artifact \
   --output type=local,dest=$(pwd)/releases/pi \
   $SECRET_ARGS \
   $CACHE_ARGS \
   --build-arg GITHUB_REF_NAME=$GITHUB_REF_NAME \
   --build-arg GITHUB_REF_TYPE=$GITHUB_REF_TYPE \
   --build-arg GIT_COMMIT_LOG="git log -1 --format='%ci %H %s'"
