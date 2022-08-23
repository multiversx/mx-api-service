The API is built to allow you to create apps or integrations quickly and easily.

This API is organized around REST principles, so if you've interacted with RESTful APIs before, many of the concepts will look familiar.

## Request
* Requests with a message body use JSON. Successful requests will return a `2xx` HTTP status.

## Response

* JSON will be returned for all responses, including errors.

## Parameters

* Some endpoints accept optional parameters which can be passed as query string params. 
* All parameters are documented along each endpoint.

## Complexity

* In order to better optimize the available resources, a complexity evaluation is performed before the execution of every request.

* The maximum complexity available is currently hardcoded at `10000`

* When listing entries, every element in the list adds `1` to the complexity, thus making it possible to retrieve a maximum of `10000` elements in list endpoints.

* If some extra info is requested, such as `withScResults` in the `/transactions` endpoint, the complexity calculation for the list is overridden with the complexity calculation of the requested field. In this situation, `withScResults` will multiply the number of items with `200`, thus limiting the maximum requested size to `50`

* Some fields use the same amount of resources whether one or more of them are requested. In this situation, the fields will be grouped together, regardless whether one or more of the same group are requested. The endpoints `/transactions?size=50&withOperations=true` will produce the same complexity as `/transactions?size=50&withOperations=true&withLogs=true&withScResults=true` since they all belong to the group `details`

## Fields

* In order to fetch only specific fields from the response, the `fields` parameter can be used:
    * `/accounts?fields=address,balance for arrays`
    * `/economics?fields=price,marketCap for object`

## Extract
* In order to extract a scalar value from an object response, the `extract` parameter can be used:
    * `/economics?extract=price`

## Cleanup
* If the value of an attribute is `undefined`, `""` (empty string), `null`, `[ ]` (empty array) the attribute will be omitted.

## Pagination

* Requests that return multiple items will be paginated to 25 items by default. 
* For a different number of items or for the next pages `?from=` and `size=` can be used.
