FROM node:18 as build

WORKDIR /usr/src/app

COPY package.json nx.json yarn.lock ./
COPY assets/services/smart-contract-api ./assets/services/smart-contract-api

COPY platform/packages/error-handler ./platform/packages/error-handler
COPY platform/packages/auth ./platform/packages/auth
COPY platform/packages/observability ./platform/packages/observability

# Install dependencies using the Yarn cache from the previous build, if one exists.
RUN --mount=type=cache,target=/yarn YARN_CACHE_FOLDER=/yarn yarn install --frozen-lockfile

# Build the Entity API and all its local dependencies.
RUN npm run build smart-contract-api

# Remove the dev dependencies.
RUN --mount=type=cache,target=/yarn YARN_CACHE_FOLDER=/yarn yarn install --frozen-lockfile --production

# Remove all source files and keep only the build output.
RUN for DIR in packages services; do \
    find ./platform/$DIR -maxdepth 2 -mindepth 2 ! \
        \( -name "package.json" \
        -or -name "dist" \
        -or -name "build" \
        -or -name "node_modules" \) \
        | xargs rm -rf \
    ; done
RUN for DIR in assets services; do \
    find ./assets/$DIR -maxdepth 2 -mindepth 2 ! \
        \( -name "package.json" \
        -or -name "dist" \
        -or -name "build" \
        -or -name "node_modules" \) \
        | xargs rm -rf \
    ; done

FROM node:18-alpine3.14 as run

WORKDIR /usr/src/app
RUN chown node -R .

USER node
EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV production
# Needed for using ethereum/tx on Node 18
ENV NODE_OPTIONS --openssl-legacy-provider

COPY --from=build --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/assets/services/smart-contract-api ./assets/services/smart-contract-api
COPY --from=build --chown=node:node /usr/src/app/platform/packages ./platform/packages
COPY --chown=node:node assets/services/smart-contract-api/buildCustom ./assets/services/smart-contract-api/buildCustom
COPY --chown=node:node assets/services/smart-contract-api/contracts ./assets/services/smart-contract-api/contracts
COPY --chown=node:node assets/services/smart-contract-api/src/config/networks.js ./assets/services/smart-contract-api/dist/config/networks.js
COPY --chown=node:node assets/services/smart-contract-api/src/config/mock ./assets/services/smart-contract-api/dist/config/mock

CMD [ "node", "assets/services/smart-contract-api/dist/index"]
