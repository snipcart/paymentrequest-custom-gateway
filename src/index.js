if (window.PaymentRequest) {

  let paymentRequest
  let paymentDetails
  let paymentSession

  document.addEventListener("DOMContentLoaded", async () => {
    await fetchPaymentSession()
    createPaymentRequest()
    renderItems()
    bindBuyButton()
  })

  const fetchPaymentSession = async () => {
    const publicToken = new URLSearchParams(window.location.search).get('publicToken')
    const response = await fetch(`https://payment.snipcart.com/api/public/custom-payment-gateway/payment-session?publicToken=${publicToken}`)

    if (!response.ok) {
      throw "Invalid token"
    }

    paymentSession = await response.json()
    console.log(paymentSession)
  }

  const createPaymentRequest = () => {
    const currency = paymentSession.invoice.currency


    const googlePaymentDataRequest = {
      environment: 'TEST',
      apiVersion: 2,
      apiVersionMinor: 0,
      merchantInfo: {
        // A merchant ID is available after approval by Google.
        // 'merchantId':'12345678901234567890',
        merchantName: 'Example Merchant'
      },
      allowedPaymentMethods: [{
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
          allowedCardNetworks: ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"]
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          // Check with your payment gateway on the parameters to pass.
          // @see {@link https://developers.google.com/pay/api/web/reference/request-objects#gateway}
          parameters: {
            'gateway': 'example',
            'gatewayMerchantId': 'exampleGatewayMerchantId'
          }
        }
      }]
    }
    const supportedMethods = [
      { supportedMethods: 'basic-card' },
      { supportedMethods: 'https://google.com/pay', data: googlePaymentDataRequest },
    ]

    items = paymentSession.invoice.items

    paymentDetails = {
      total: {
        label: 'TOTAL',
        amount: {
          currency: currency,
          value: paymentSession.invoice.amount
        }
      },
      displayItems: paymentSession.invoice.items.map(i => {
        const isItem = i.type !== 'Discount' && i.type !== 'Tax' && i.type !== 'Shipping'
        const label = isItem ? `${i.name} x ${i.quantity}` : i.name
        return {
          label,
          amount: {
            value: i.amount,
            currency
          }
        }
      })
    }

    const options = {
      requestPayerEmail: true,
      requestPayerName: true
    }
    paymentRequest = new PaymentRequest(
      supportedMethods,
      paymentDetails,
      options
    )
  }

  const bindBuyButton = () => {
    paymentRequest.canMakePayment()
      .then(function (result) {
        if (result) {
          // Display PaymentRequest dialog on interaction with the existing checkout button
          document.getElementById('pay')
            .addEventListener('click', onBuyClicked);
        }
      })
      .catch(function (err) {
        console.log(err)
      })
  }
  const onBuyClicked = async () => {
    const canMakePayment = await paymentRequest.canMakePayment()
    if (!canMakePayment) {
      alert('Cant make payment')
      return
    }
    try {
      const paymentRes = await paymentRequest.show()
      handlePayment(paymentRes)
    } catch (e) {
      console.log(e)
    }
  }

  const handlePayment = async (paymentRes) => {
    console.log("success")
    paymentRes.complete('success')
    // console.log(paymentRes)
    try{
      const res = await axios.post('/api/confirm-payment', paymentRes)
      console.log(res)
    }catch(e){
      console.error(e)
    }
    
  }

  const renderItems = () => {
    const tbody = document.querySelector('tbody')
    paymentSession.invoice.items.forEach(i => {
      const isItem = i.type !== 'Discount' && i.type !== 'Tax' && i.type !== 'Shipping'

      const row = document.createElement('tr')

      if (!isItem) {
        row.classList.add('text--grey')
      }

      const labelElement = document.createElement('td')
      const label = document.createTextNode(isItem ? `${i.name} x ${i.quantity}` : i.name)
      labelElement.appendChild(label)

      const priceElement = document.createElement('td')
      const price = document.createTextNode(i.amount)
      priceElement.appendChild(price)

      row.appendChild(labelElement)
      row.appendChild(priceElement)
      tbody.appendChild(row)
    })

    const tfoot = document.querySelector('tfoot')
    const row = document.createElement('tr')
    const totalElement = document.createElement('td')
    const label = document.createTextNode(paymentDetails.total.label)
    totalElement.appendChild(label)

    const priceElement = document.createElement('td')
    const price = document.createTextNode(paymentDetails.total.amount.value)
    priceElement.appendChild(price)

    row.appendChild(totalElement)
    row.appendChild(priceElement)

    tfoot.appendChild(row)
  }


}