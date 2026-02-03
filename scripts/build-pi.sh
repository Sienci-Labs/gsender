if docker buildx ls | grep -q buildx-builder -eq 1; then
   docker buildx create --name  buildx-builder --use
fi
mkdir -p release/pi/

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

docker buildx build  -f DockerfilePi . \
   --platform linux/arm64 \
   --target=artifact \
   --output type=local,dest=$(pwd)/releases/pi \
   $SECRET_ARGS \
   --build-arg GITHUB_REF_NAME=$GITHUB_REF_NAME \
   --build-arg GITHUB_REF_TYPE=$GITHUB_REF_TYPE \
   --build-arg GIT_COMMIT_LOG="git log -1 --format='%ci %H %s'" \
   --no-cache
