FROM node:20.11.0-bookworm as base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app


# Install app dependencies
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
COPY packages/server/package.json /app/packages/server/package.json
COPY packages/core/package.json /app/packages/core/package.json
COPY lerna.json /app/lerna.json
RUN yarn --frozen-lock-file

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY ./testconfig/config.json /app/
RUN mv ./packages/server/next.config.js.docker ./packages/server/next.config.js
RUN yarn bootstrap
RUN yarn build

# Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/packages/server/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/server/.next/static ./.next/static
COPY ./testconfig/.env /app/packages/server/

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "./packages/server/server.js"]
