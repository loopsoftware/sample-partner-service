# Example of a partner's service

The example works in assemble with [Sample-invoicing app](https://github.com/loopsoftware/sample-invoicing).
 
### Creating an image

 1. pull latest docker image 
    ```bash 
    docker pull yupana/partner:latest
    ```
 1. get latest package.json
    ```bash
    mv package.json mypackage.json
    docker run --name partner-base yupana/partner:latest
    docker cp partner-base:/app/yupana/service/package.json ./package.json
    docker rm -v partner-base
    ```
 1. update `files` section of [package.json](./package.json) to include your files
    ```bash
    vimdiff mypackage.json package.json
    ```
 1. update [Dockerfile](./Dockerfile) to copy your files to the image
 1. build the image
    ```bash
    docker build -t sample-partner ./
    ```  

### Registering the service

The service get a unique name during [registration](https://github.com/YupanaInc/Yupana-Framework/blob/build/2.2.1/documentation/external-applications.md#application-registration).
This name can be used to make http requests to partner's own API - 
[getUserInfo()](main.js#L44) in this example.

This example uses https://auth0.com as an eternal API which uses an extension of 
OpenID Connect protocol and is also an identity provider.

Details of the example application registered on auth0:

 - domain: `quipu.auth0.com`
 - metadata: https://quipu.auth0.com/.well-known/openid-configuration
 - client ID: `qlqf0gXYMyOm665w3p8zbxPrYarZbeRy`
 - client Secret: `please ask app secret`
 - callback URLs: 
   - https://localhost:3000/callback
   - https://devloop.loopsoftware.fr/authorize 

Details of the user:

  - email: `user@testpartner.fr`
  - password: `please ask user password`

Docker details:
  - container name: `test-parner-container`
   
With this information at hands, registration of the service with name `test-partner` 
to `INVOICING` database only can be  like this:

```bash
curl "https://devloop.loopsoftware.fr/YPND/testRole/2.2.1.1.2.3/app/register?name=test-partner&domain=main" \
  -b "sessionId=$TEST_SESSION" \
  -H 'x-requested-with: fetchrequest' \
  -H 'content-type: application/json' \
  --data-binary '{
    "dbId": "INVOICING",
    "description":"Partner sample",
    "type":"﻿OpenIDConnect",
    "settings" : {
      "clientID" : "qlqf0gXYMyOm665w3p8zbxPrYarZbeRy",
      "clientSecret" : "please ask app secret",
      "callbackURL" : "https://devloop.loopsoftware.fr/authorize",
      "metadataURL" : "https://quipu.auth0.com/.well-known/openid-configuration",
      "scope" : "openid profile",
      "authorizationURLparams" : {
        "connection" : "Username-Password-Authentication"
      }
    },
    "disabled":false,
    "service":"test-parner-container"
  }'
```

Upon successful registration `fetch` requests to external API 
(https://quipu.auth0.com/userinfo in this example) can be signed with 
Authorization header providing name of the application (`test-partner` 
in this example) as a `serviceProvider` option of the request, e.g.: 

```javascript
fetch(
    "https://quipu.auth0.com/userinfo", 
    {
        serviceProvider: {
            name: "test-partner",  
            domain: domain,
            dbId: dbId
        }
    },
    session,
    role,
    serv
)
```

### Interactive authentication on external resource

On first call, or if the access token has expired the `fetch` request fails with
an error that contain `idp` property which can be used to interactively authenticate 
the user on external resource. The default authentication prompt can be retrieved 
using `utils.defaultLoginPrompt(serv, session, role, error.idp, "Quipu Inc")` where 
the last parameter is a title of the partner that will be shown to the user.
A custom authentication prompt should use a relative url retrieved from
`utils.getAuthorizationLink(serv, session, role, error.idp)` and have `target="blank"` 
to open the authorization form in a new window. 

In this example the user should follow the authentication link to auth0.com and 
login using email and password. On successful login user's session will be updated 
with new access token and the webView will be refreshed. 
