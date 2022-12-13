# @consensys/authentication

A package to manage authentication of Codefi services

## Prerequisites

You need to use setup an OAuth-compliant identity provider, for example on Auth0.

## Usage

There are 3 types of routes:

- **Unprotected routes**: no verification is performed for those kind of routes
- **Machine routes**: a machine authentication verification is performed for those kind of routes (no userId required)
- **User routes[majority of routes]**: a user authentication verification is performed for those kind of routes (userId required → we act as a given user)

Example of controller for an unprotected route:

```
@Post()
async healthcheck() {
  return "Ok"
}
```

Example of controller for a “machine route”:

```
@Post()
@Protected(true, ['token:create'])
async create(@Body() createTokenDto: CreateTokenDto) {
  return this.tokenService.create(createTokenDto);
}
```

@Protected decorator has 2 parameters:

- **checkAuthentication**: boolean // If set to true, checkAuthentication method is executed
- **checkPermissions**: string[] // If array.length>0, checkPermissions method is executed

Example of access token that can be extracted from authorization headers:

```
{
  "iss": "https://codefi-prod.eu.auth0.com/",
  "aud": [
    "https://assets.codefi.network",
    "https://codefi-prod.eu.auth0.com/userinfo"
  ],
  "sub": "auth0|5ffc9175a9b7f00068f53b45",
  "exp": 1610773022,
  "permissions": [
    "token:create",
    "token:retrieve",
    "token:update",
    "token:delete"
  ]
  "https://api.codefi.network": { // Custom claims added by an Auth0 rule
    "tenantId": "pDQKdD9PXQv8NhYXjc45YQDJJiLJKMmw",
  },
}
```

### Description of checkAuthentication function

The function performs the following actions:

- Extract access token from Authorization headers
- Check token’s signature
- Check token’s expiration date
- Check token’s audience

### Description of checkPermissions function

The function performs the following actions:

- Extract access token from Authorization headers
- Extract permissions from access token
- Check permissions requested by controller are included

### Description of checkUserMetadata function

The function performs the following actions:

- Extract access token from Authorization headers
- Extract subject from access token (subject = ID of user in Auth0)
- Fetch user’s metadata in Metadata-API
- Inject user’s metadata in context

## Configuration

Package can be configured via ENV

```
# Url of identity provider (Auth0 in the context of Codefi)
AUTH0_URL=https://sample.eu.auth0.com/

# if "true" we can bypass authentification, for test/dev purposes
AUTH_BYPASS_AUTHENTICATION_CHECK=false # default is "false"

# if "true" we can bypass permissions check, for test/dev purposes
AUTH_BYPASS_PERMISSION_CHECK=false # default is "false"

# setup accepted audience for token verification, optional parameter, skip it for bypass audience check
AUTH_ACCEPTED_AUDIENCE=https://assets.codefi.network

# setup custom namespace to get it from payload, not used at the moment
AUTH_CUSTOM_NAMESPACE=https://api.codefi.network

# determines if the permissions are stored within the custom claim. Used for multitenancy
AUTH_CHECK_PERMISSIONS_CUSTOM_CLAIM

# setup custom namespace for orchestrate claims
AUTH_CUSTOM_ORCHESTRATE_NAMESPACE

# setup algorythm, e.g. HS256, etc
AUTH_ALGORYTHM=RS256 # default is "RS256"

# for HMAC-based algorythms, we will ignore JWKS request and use this param as cert
AUTH_HMAC_SECRET=your-secret-here

# enables redis cache for M2mTokenService
M2M_TOKEN_REDIS_ENABLE=true

# redis host and password for M2mTokenService
M2M_TOKEN_REDIS_HOST=
M2M_TOKEN_REDIS_PASS=

# redis token renewal threshold percentage (0-100).
M2M_TOKEN_EXPIRE_THRESHOLD=100
```
