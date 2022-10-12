FROM node:18 as build

WORKDIR /usr/src/app

COPY package.json nx.json yarn.lock ./
COPY assets/services/assets-front ./assets/services/assets-front

# Install dependencies using the Yarn cache from the previous build, if one exists.
RUN --mount=type=cache,target=/yarn YARN_CACHE_FOLDER=/yarn yarn install --frozen-lockfile


ENV REACT_APP_DOMAIN_NAME %REACT_APP_DOMAIN_NAME%
ENV REACT_APP_AUTH_CLIENT_ID %REACT_APP_AUTH_CLIENT_ID%
ENV REACT_APP_AUTH_DOMAIN %REACT_APP_AUTH_DOMAIN%
ENV REACT_APP_AUTH_AUDIENCE %REACT_APP_AUTH_AUDIENCE%
ENV REACT_APP_APP_URL %REACT_APP_APP_URL%
ENV REACT_APP_CBDC_BASE_URL %REACT_APP_CBDC_BASE_URL%
ENV REACT_APP_ENABLE_APM %REACT_APP_ENABLE_APM%
ENV REACT_APP_ZENDESK_KEY %REACT_APP_ZENDESK_KEY%
ENV REACT_APP_ELASTIC_APM_SERVER_URL %REACT_APP_ELASTIC_APM_SERVER_URL%
ENV REACT_APP_MAINTENANCE_MODE %REACT_APP_MAINTENANCE_MODE%
ENV GENERATE_SOURCEMAP false

# Build the Assets Front and all its local dependencies.
RUN npm run build assets-front

# Remove all source files and keep only the build output.
RUN for DIR in packages services; do \
    find ./assets/$DIR -maxdepth 2 -mindepth 2 ! \
        \( -name "package.json" \
        -or -name "dist" \
        -or -name "build" \
        -or -name "node_modules" \) \
        | xargs rm -rf \
    ; done

FROM nginx:1.23.0-alpine as run

WORKDIR /var/www/app

EXPOSE 8080

COPY assets/services/assets-front/docker/entrypoint.sh /opt/entrypoint.sh
COPY assets/services/assets-front/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/assets/services/assets-front/build .

RUN touch /var/run/nginx.pid && \
    chown -R 1000 /var/run/nginx.pid && \
    chown -R 1000 /var/cache/nginx && \
    chown -R 1000 /var/www/app && \
    chown -R 1000 /etc/nginx/conf.d/ && \
    mkdir -p /var/log/nginx && \
    mkdir -p /var/run/nginx && \
    chown -R 1000 /var/log/nginx && \
    chown -R 1000 /var/run/nginx/

USER 1000
ENTRYPOINT ["sh", "/opt/entrypoint.sh"]
CMD ["nginx-fe"]
