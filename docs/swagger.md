The API is built to allow you to create apps or integrations quickly and easily.

This API is organized around REST principles, so if you've interacted with RESTful APIs before, many of the concepts will look familiar.

## Request
* Requests with a message body use JSON as well. Successful requests will return a `2xx` HTTP status.

## Parameters

* Some endpoints accept optional parameters which can be passed as query string params. 
* All parameters are documented along each endpoint.

  e.g. `GET /blocks?fields=hash,epoch,round,sizeTxs`

## Pagination

* Requests that return multiple items will be paginated to 25 items by default. 
* For a different number of items or for the next pages `?from=` and `size=` can be used.

## Response Format

* JSON will be returned for all responses, including errors. Empty or blank fields are omitted. 
