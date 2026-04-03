FROM oven/bun:latest
WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN

COPY package.json bun.lock* .npmrc ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "run", "start"]