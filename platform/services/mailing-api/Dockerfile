FROM node:18 as build

WORKDIR /usr/src/app

COPY package.json nx.json yarn.lock ./
COPY platform/services/mailing-api ./platform/services/mailing-api

# Copy the required package dependencies.
COPY platform/packages/auth ./platform/packages/auth
COPY platform/packages/error-handler ./platform/packages/error-handler
COPY platform/packages/observability ./platform/packages/observability

# Install dependencies using the Yarn cache from the previous build, if one exists.
RUN --mount=type=cache,target=/yarn YARN_CACHE_FOLDER=/yarn yarn install --frozen-lockfile

# Build the Mailing API and all its local dependencies.
RUN npm run build mailing-api

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

FROM node:18-alpine3.14 as run

WORKDIR /usr/src/app
RUN chown node -R .

USER node
EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV production

COPY --from=build --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/platform/services/mailing-api ./platform/services/mailing-api
COPY --from=build --chown=node:node /usr/src/app/platform/packages ./platform/packages

CMD [ "node", "platform/services/mailing-api/dist/main"]
