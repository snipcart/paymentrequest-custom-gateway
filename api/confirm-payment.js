import axios from 'axios'

export default async (req, res) => {
  const data = {
    paymentSessionId: req.requestId,
    state: 'processed',
    transactionId: req.requestId,
    instructions: 'Your payment will appear on your statement in the coming days',
  }

  const options = {
    headers: {
      Authorization: `Bearer ${process.env.SNIP_PAYMENT_API_KEY}`
    }
  }

  try{
    const resp = await axios.post(`${process.env.PAYMENT_URL}/api/private/custom-payment-gateway/payment`,data, options)
    return res.json({
      returnUrl: resp.data.returnUrl
    })
  }catch(e){
    console.error(e)
  }

  return res.status(500).send()
}