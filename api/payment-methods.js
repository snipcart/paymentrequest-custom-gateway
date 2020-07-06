import axios from 'axios'

export default async (req, res) => {
  console.log(JSON.stringify(req.body))
  if (req.body && req.body.publicToken) {
    try {
      // Validate the request was made by Snipcart
      await axios.get(`${process.env.PAYMENT_URL}/api/public/custom-payment-gateway/validate?publicToken=${req.body.publicToken}`)

      // Return the payment methods
      return res.json([{
        id: 'sleeky_pay',
        name: 'SleekyPay',
        checkoutUrl: `https://sleeky-pay.netlify.app/index.html`,
      },{
        id: 'paymentrequest-custom-gateway',
        name: 'Google pay',
        checkoutUrl: process.env.CHECKOUT_URL,
        iconUrl: `${process.env.CHECKOUT_URL}/google_pay.png`
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
