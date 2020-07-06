export default async (req, res) => {
  const { transactionId } = req.query
  try {
    // Validate the request was made by Snipcart
    await axios.get(`${process.env.PAYMENT_URL}/api/public/custom-payment-gateway/validate?publicToken=${req.body.publicToken}`)

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