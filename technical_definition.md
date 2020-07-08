
# Snipcart API Endpoints
The base url for the custom payment gateway API is `https://payment.snipcart.com/api`

## Validate public token
**`GET`**  `/public/custom-payment-gateway/validate?publicToken=<SOME_TOKEN>`

__This is important to prevent fraudulent payments__  
When calling your API, we will always send a `publicToken`. Use this endpoint to validate the request was made by our API.  
This token should __always__ be validated to prevent fraudulent attempts.
<br/>

### Request  
<div class="columns">  
<div class="column">  

**`publicToken`**`string` - _Required_  
The public key of an ongoing payment sessions.
</div>
<div class="column">

```bash
curl --request GET \
  --url 'https://payment.snipcart.com/api/public/custom-payment-gateway/validate?publicToken=<SOME_TOKEN>' \
```
</div>
</div>
<br/>
<br/>

## Retrieve a payment session  
**`GET`**  `/public/custom-payment-gateway/payment-session?publicToken=<SOME_TOKEN>`  
Retrieves the payment session from the publicToken.
<br/>

### Request
<div class="columns">
<div class="column">

**`publicToken`**`string` - _Required_  
The public key of an ongoing payment sessions.
</div>
<div class="column">

```bash
curl --request GET \
  --url 'https://payment.snipcart.com/api/public/custom-payment-gateway/payment-session?publicToken=<SOME_TOKEN>' \
```
</div>
</div>

### Response  
<div class="columns">
<div class="column">

**`id`**`Guid`  
The payment session's Id.

---
**`invoice`**[`Invoice`](#invoice)  
The session's invoice

---
**`paymentAuthorizationRedirectUrl`**`string`  
The url to redirect to once the checkout flow is completed.

---

</div>
<div class="column">

```json
{
  "invoice": {
    "shippingAddress": {
      "name": "John Doe",
      "streetAndNumber": "123 Street",
      "postalCode": "12345",
      "country": "US",
      "city": "Cuppertino",
      "region": null
    },
    "billingAddress": {
      "name": "John Doe",
      "streetAndNumber": "123 Street",
      "postalCode": "12345",
      "country": "US",
      "city": "Cuppertino",
      "region": null
    },
    "email": "john.doe@example.com",
    "language": "en",
    "currency": "usd",
    "amount": 409.29,
    "targetId": "226086da-57be-4b92-b950-5fd632be7767",
    "items": [
      {
        "name": "Rosy-Fingered Dawn at Louse Point",
        "unitPrice": 49.95,
        "quantity": 1,
        "type": "Physical",
        "rateOfTaxIncludedInPrice": 0,
        "amount": 49.95
      },
      {
        "name": "Starry Night",
        "unitPrice": 79.95,
        "quantity": 3,
        "type": "Physical",
        "rateOfTaxIncludedInPrice": 0,
        "amount": 239.85
      },
      {
        "name": "Sales tax",
        "unitPrice": 19.49,
        "quantity": 1,
        "type": "Tax",
        "rateOfTaxIncludedInPrice": 0,
        "amount": 19.49
      },
      {
        "name": "FREE SHIPPING OVER 250$",
        "unitPrice": 0,
        "quantity": 1,
        "type": "Shipping",
        "rateOfTaxIncludedInPrice": 0,
        "amount": 0
      }
    ]
  },
  "id":"b2eb036a-842ee242-0d2d-4fad-bc9a-de16411fc6d1",
  "paymentAuthorizationRedirectUrl":"https://example.com#/checkout",
}
```
</div>
</div>
<br/>
<br/>

## Create payment
**`POST`**  `/private/custom-payment-gateway/payment`  
Creates a payment for the payment session (confirms the payment)
<br/>

### Request
<div class="columns">  
<div class="column">  

__Headers__  
**`Authorization`**`string` - _Required_  
`Bearer <YOUR_SECRET_API_KEY>`
The authorization request header is used to validate your credentials with the server. Its value must be a bearer token that contains your secret API key.

---
**`Content-Type`**`string` - _Required_  
`application/json`
Our API only accepts application/json content type, so you must always specify the `application/json` content type in each request you make.

---
__Body__  
**`paymentSessionId`**`string` - _Required_  
The ID of the payment session

---
**`state`**`"processing" | "processed" | "invalidated" | "failed"` - _Required_  
The current state of the payment. Possible values are: `processing`, `processed`, `invalidated` and `failed`.

---
**`transactionId`**`string` - _Required_  
The unique ID of the transaction. The payment gateway often provides this.

---
**`error`**`Error` 
Represents the error message you want to display to the customer inside the payment step if applicable.

---
<div class="pl-2">

__Error__  
**`code`**`string` - _Required_  
This is used to used to localize the message in the cart.  
**`message`**`string`  
This is used as a fallback when no match is found for&nbsp;`code`
</div>

---

**`instructions`**`string`  
Additional instructions you want to display to your customer inside the order confirmation screen.

---
<div id="links">

**`links`**`Links`  
</div>
The `links` object stores utility links for the payment. For instance, you can specify the refund URL using the `refunds` key.

---
<div class="pl-2">

__Links__  
**`refunds`**`string` 
This will be called when a refund is issued via the merchant dashboard
</div>
</div>
<div class="column">

```bash
curl --request POST \
  --url https://payment.snipcart.com/api/private/custom-payment-gateway/payment \
  --header 'Authorization: Bearer <YOUR_SECRET_API_KEY>' \
  --header 'content-type: application/json' \
  --data '{
		"paymentSessionId": "5e921d3b-8756-4fd0-87e9-c72f946535ed",
		"state": "failed",
		"error": {
			"code": "card_declined",
			"message": "Your card was declined"
		}
}'
```
</div>
</div>

# Webhooks
Those are the API endpoints you will need to create to integrate your own Payment gateway. Our API will call them with a `publicToken` in the request body.   
__Don't forget to validate the request by using the [`/validate`](#get---validate) endpoint__

## Payment methods

The first important endpoint your API should have is one returning the available **payment methods**.
When a client checkouts, we will call your API endpoint to show them the available payment methods.

We will send a `POST` request to the `payment method URL` specified in the [merchant dashboard](https://app.snipcart.com/dashboard/account/gateway/customgateway).

We expect to receive an array of `PaymentMethod`.
<br/>

### __Request__
<div class="columns">
<div class="column">

__Method__ `POST`  

__Body__  
**`invoice`**[`Invoice`](#invoice)  
The invoice of the current order

---

**`publicToken`**`string`  
Used to validate the request was made by Snipcart

---

**`mode`**`"test" | "live"`  
The order's mode.
</div>
<div class="column">

```json
{
  "invoice": {
    "shippingAddress": {
      "name": "John Doe",
      "streetAndNumber": "123 Street",
      "postalCode": "12345",
      "country": "US",
      "city": "Cuppertino",
      "region": null
    },
    "billingAddress": {
      "name": "John Doe",
      "streetAndNumber": "123 Street",
      "postalCode": "12345",
      "country": "US",
      "city": "Cuppertino",
      "region": null
    },
    "email": "john.doe@example.com",
    "language": "en",
    "currency": "usd",
    "amount": 409.29,
    "targetId": "226086da-57be-4b92-b950-5fd632be7767",
    "items": [
      {
        "name": "Rosy-Fingered Dawn at Louse Point",
        "unitPrice": 49.95,
        "quantity": 1,
        "type": "Physical",
        "rateOfTaxIncludedInPrice": 0,
        "amount": 49.95
      },
      ...
    ]
  },
  "publicToken": "<JWT_TOKEN>",
  "mode": "test"
}
```
</div>
</div>
<br/>

### Response
<div class="columns">
<div class="column">

__Body__  
`PaymentMethods[]` - _Required_  
The available payment methods for the current order.

<div class="pl-2">

__PaymentMethod__  
**`id`**`string` - _Required_  
This is the id of the payment method.

---
**`name`**`string` - _Required_  
The name of the payment method (this will be shown during the checkout phase)

---
**`checkoutUrl`**`string` - _Required_  
The url of your checkout page.

---
**`iconUrl`**`string`  
If you'd like to show an icon instead of a name during the checkout phase, you can set it here.

---
_Note that only the name or the icon will be shown, not both_

</div>
</div>
<div class="column">

```json
{
  "headers": {
    "content-type": "application/json"
  },
  "body": [
    {
      "id": "snipcart_custom_gatway_1",
      "name": "Custom gateway 1",
      "checkoutUrl": "https://snipcart.com/checkout_gateway_1",
    },
    {
      "id": "snipcart_custom_gatway_2",
      "name": "Custom gateway 2",
      "checkoutUrl": "https://snipcart.com/checkout_gateway_2",
      "iconUrl": "https://snipcart.com/checkout_gateway_2/icon.png"
    }
  ]
}
```
</div>
</div>
<br/>

## Refund  
This is the [refund endpoint](#links) you can provide when confirming the payment with our api. When refunding a client from the merchant dashboard, this endpoint will be called.
<br/>

### __Request__
<div class="columns">
<div class="column">

__Method__ `POST`  

__Body__  
**`paymentId`**`string`  
The payment we want to refund.

---

**`amount`**`number`  
The amount to want to refund.

</div>
<div class="column">

```json
{
  "paymentId": "d3031d89-e428-4cb8-bf0e-74b883466736",
  "amount": 20.75
}
```
</div>
</div>
<br/>

### __Response__
<div class="columns">
<div class="column">

**`refundId`**`Guid`  
The id of the refund.
</div>
<div class="column">

```json
{
  "body": {
	  "refundId": "940bb5bc-13f7-4d02-987f-fad12ab98ebb"
  }
}
```
</div>
</div>


# Types

## Invoice
<div class="columns">
<div class="column">

**`shippingAddress`**[`Address`](#address)  
The order's shipping address.

---
**`billingAddress`**[`Address`](#address)  
The order's billing address.

---

**`email`**`string`  
The client's email address.

---

**`language`**`string`  
The cart's language.

---

**`currency`**`string`  
The order's currency.

---

**`amount`**`number`  
The order's grand total.

---

**`targetId`**`Guid`  
The cart's ID

---

**`items`**[`Item[]`](#item)  
The order's items.
</div>
<div class="column">

```json
{
  "shippingAddress": {
    ...
  },
  "billingAddress": {
    ...
  },
  "email": "john.doe@example.com",
  "language": "en",
  "currency": "usd",
  "amount": 409.29,
  "targetId": "226086da-57be-4b92-b950-5fd632be7767",
  "items": [
    ...
  ]
}
```
</div>
</div>
<br/><br/>

## Address  
<div class="columns">
<div class="column">

**`name`**`string`  
Recipient's full name (first name and last name)

---

**`streetAndNumber`**`string`  
Street and civic street number.

---

**`postalCode`**`string`  

---

**`country`**`string`  

---

**`city`**`string`

</div>
<div class="column">

```json
{
  "name": "John Doe",
  "streetAndNumber": "123 Street",
  "postalCode": "12345",
  "country": "US",
  "city": "Cuppertino",
  "region": null
}
```
</div>
</div>
<br/><br/>

## Item
<div class="columns">
<div class="column">

**`name`**`string`  

---

**`unitPrice`**`number`  
The price of the item

---

**`quantity`**`number`  

---

**`type`**`"Physical" | "Digital" | "Tax" | "Shipping" | "Discount"`  
Represents the item type.

---

**`rateOfTaxIncludedInPrice`**`number`  

---

**`amount`**`number`  
The `quantity` * `unitPrice`
</div>
<div class="column">

```json
{
  "name": "Rosy-Fingered Dawn at Louse Point",
  "unitPrice": 49.95,
  "quantity": 1,
  "type": "Physical",
  "rateOfTaxIncludedInPrice": 0,
  "amount": 49.95
}
```
</div>
</div>