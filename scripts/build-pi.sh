if docker buildx ls | grep -q buildx-builder -eq 1; then
   docker buildx create --name  buildx-builder --use
fi
mkdir -p release/pi/
docker buildx build  -f DockerfilePi . \
   --platform linux/arm64 \
   --target=artifact \
   --output type=local,dest=$(pwd)/releases/pi \
   --build-arg GITHUB_REF_NAME=$GITHUB_REF_NAME \
   --build-arg GITHUB_REF_TYPE=$GITHUB_REF_TYPE \
   --build-arg GIT_COMMIT_LOG="git log -1 --format='%ci %H %s'" \
   --no-cache