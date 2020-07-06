import axios from 'axios'

export default async (req, res) => {
  try {
    const {publicToken} = req.query
    const resp = await axios.get(`${process.env.PAYMENT_URL}/api/public/custom-payment-gateway/payment-session?publicToken=${publicToken}`)
    return res.json(resp.data)
  } catch (e) {
    console.error(e)
    return res.status(500).send()
  }
}