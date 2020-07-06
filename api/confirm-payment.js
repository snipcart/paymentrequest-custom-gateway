import axios from 'axios'

export default async (req, res) => {

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
      refunds: `${process.env.CHECKOUT_URL}/api/refund?transactionId=${req.body.requestId}`
    },
  }

  // Add authentification
  // This is the secret API key created in Snipcart's merchant dashboard
  const options = {
    headers: {
      Authorization: `Bearer ${process.env.SNIP_PAYMENT_API_KEY}`
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