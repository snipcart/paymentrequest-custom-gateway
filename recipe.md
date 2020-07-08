# Integrating a custom payment gateway
Before you get started, make sure you [configured your merchant dashboard](/v3/custom-payment-gateway/merchant-configuration) and have a [basic understanding](/v3/custom-payment-gateway/technical-reference) of how the Custom payment gateway works

## 1. Creating the checkout page
The first step to integrate a custom payment gateway, is to create the checkout page. This is the page the user will be redirected to when using the custom gateway. When redirecting to this page, we will add the `publicToken` query param.  
> ex: `YOUR_CHECKOUT_URL.com?publicToken=<THE_TOKEN>`  

In the checkout page, you will want to retrieve information about the order. To do so, you will need to call our payment-session API endpoint. This will allow you to display order information on the checkout page.
Learn how to [retrieve information about the payment session](/v3/custom-payment-gateway/definition#retrieve-a-payment-session).

This is how our demo checkout page looks. It uses the [Payment Request API](https://developer.mozilla.org/en-US/docs/Web/API/Payment_Request_API). 
![](https://cdn.sanity.io/images/zac9i1uu/dev/9d8f2f4a46457a05b81644166d890612bc172955-605x405.png?w=1000&h=1000&fit=max)
[see Github repo for more details](https://github.com/snipcart/paymentrequest-custom-gateway)

## 2. Payment methods endpoint
The second step to integrate a custom payment gateway, is to create the payment methods endpoint. The `publicToken` will be provided in the request body. 

__Make sure you [validate](/v3/custom-payment-gateway/reference#validate-public-token) the request was made by our API.__

[Payment methods webhook reference](/v3/custom-payment-gateway/reference#payment-methods).
```javascript
async (req, res) => {
  if (req.body && req.body.publicToken) {
    try {
      // Validate the request was made by Snipcart
      await axios.get(`https://payment.snipcart.com/api/public/custom-payment-gateway/validate?publicToken=${req.body.publicToken}`)

      // Return the payment methods
      return res.json([{
        id: 'paymentrequest-custom-gateway',
        name: 'Google pay',
        checkoutUrl: 'https://paymentrequest-custom-gateway.snipcart.vercel.app',
        iconUrl: `https://paymentrequest-custom-gateway.snipcart.vercel.app/google_pay.png`
      }])
    }catch(e){
      // Couldn't validate the request
      console.error(e)
      return res.status(401).send()
    }
  }

  // No publicToken provided. This means the request was NOT made by Snipcart
  return res.status(401).send()
}
```

## 3. Confirm payment
This endpoint is used to validate the Payment with Snipcart when the payment is approved by your payment gateway. It should be called with the payment information. This has to be done server-side since we don't want to leak our __secret__ API Key.

[Create payment reference](/v3/custom-payment-gateway/reference#create-payment).
```javascript
async (req, res) => {

  // TODO: Validate the request was approved by your payment gateway (in this case Google Pay)

  // Parse the gateway payment info to match Snipcart's schema
  // This will change depending on the payment gateway you choose
  const paymentSessionId = req.query.sessionId
  const data = {
    paymentSessionId,
    state: 'processed',
    transactionId: req.body.requestId,
    instructions: 'Your payment will appear on your statement in the coming days',
    links: {
      refunds: `https://paymentrequest-custom-gateway.snipcart.vercel.app/api/refund?transactionId=${req.body.requestId}`
    },
  }

  // Add authentification
  // This is the secret API key created in Snipcart's merchant dashboar
  const options = {
    headers: {
      Authorization: 'Bearer <YOUR_SECRET_API_KEY>'
    }
  }

  try{
    // Confirm payment with Snipcart
    const resp = await axios.post(`${process.env.PAYMENT_URL}/api/private/custom-payment-gateway/payment`,data, options)
    
    // ReturnUrl will redirect the user to the Order confirmation page of Snipcart
    return res.json({
      returnUrl: resp.data.returnUrl
    })
  }catch(e){
    console.error(e)
  }

  return res.status(500).send()
}
```

## 4. Refund (Optional)
This will be called when refunding an order via the merchant dashboard.

__Make sure you [validate](/v3/custom-payment-gateway/reference#validate-public-token) the request was made by our API.__

[Refund webhook reference](/v3/custom-payment-gateway/reference#refund)
```javascript
async (req, res) => {
  const { transactionId } = req.query
  try {
    // Validate the request was made by Snipcart
    await axios.get(`https://payment.snipcart.com/api/public/custom-payment-gateway/validate?publicToken=${req.body.publicToken}`)

    // TODO: Refund the order via the gateway
    
    return res.json({
      refundId: transactionId
    })
  } catch (e) {
    // Couldn't validate the request
    console.error(e)
    return res.status(401)
  }
}
```

