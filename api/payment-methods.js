import axios from 'axios'

export default async (req, res) => {
  if (req.body && req.body.publicToken) {
    console.log(req.body.publicToken)
    try {
      await axios.get(`${process.env.PAYMENT_URL}/api/public/custom-payment-gateway/validate?publicToken=${req.body.publicToken}`)
      return res.json([{
        id: 'paymentrequest-custom-gateway',
        name: 'Google pay',
        checkoutUrl: 'https://paymentrequest-custom-gateway-bpd1p4ouk.vercel.app'
      }])
    }catch(e){
      console.error(e)
    }
  }
  return res.status(500).send()
}
