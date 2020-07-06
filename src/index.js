if (window.PaymentRequest) {

  let paymentRequest
  let paymentDetails
  let paymentSession
  let currencyFormatter

  document.addEventListener("DOMContentLoaded", async () => {
    await fetchPaymentSession()
    createPaymentRequest()
    renderItems()
    bindBuyButton()
  })

  // Get the payment session from Snipcart
  const fetchPaymentSession = async () => {
    const publicToken = new URLSearchParams(window.location.search).get('publicToken')
    try {
      const response = await axios.get(`/api/payment-session?publicToken=${publicToken}`)
      paymentSession = response.data
      document.querySelector('#loader').classList.add('hidden')
      document.querySelector('#content').classList.remove('hidden')
    } catch (e) {
      document.querySelector("#invoice_not_found").classList.remove("hidden")
      document.querySelector('#loader').classList.add('hidden')
      console.error(e)
    }
  }

  // Create the payment request (Using the Payment Request API)
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

  // Add the buy button Event Listener
  const bindBuyButton = () => {
    paymentRequest.canMakePayment()
      .then(function (result) {
        if (result) {
          document.getElementById('pay')
            .addEventListener('click', onBuyClicked);
        }
      })
      .catch(function (err) {
        console.log(err)
      })
  }

  // Add the event listener on the Buy button
  const onBuyClicked = async () => {
    document.querySelector('#button_loader').classList.remove('hidden')
    const canMakePayment = await paymentRequest.canMakePayment()
    if (!canMakePayment) {
      alert('Cant make payment')
      return
    }
    try {
      const paymentRes = await paymentRequest.show()
      await handlePayment(paymentRes)
    } catch (e) {
      console.log(e)
    } finally {
      document.querySelector('#button_loader').classList.add('hidden')
    }
  }

  // Payment completed callback
  const handlePayment = async (paymentRes) => {
    paymentRes.complete('success')
    try {
      const res = await axios.post(`/api/confirm-payment?sessionId=${paymentSession.id}`, paymentRes)
      window.location.href = res.data.returnUrl
    } catch (e) {
      console.error(e)
    }

  }

  // Display order items in the checkout
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
      const price = document.createTextNode(formatCurrency(i.amount))
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
    const price = document.createTextNode(formatCurrency(paymentDetails.total.amount.value))
    priceElement.appendChild(price)

    row.appendChild(totalElement)
    row.appendChild(priceElement)

    tfoot.appendChild(row)
  }

  const formatCurrency = (amout) => {
    if (currencyFormatter == null) {
      let lang = 'en-US'
      if (navigator.language != null) {
        lang = navigator.language
      }
      currencyFormatter = new Intl.NumberFormat(lang, { style: 'currency', currency: paymentSession.invoice.currency })
    }
    return currencyFormatter.format(amout)
  }


} else {
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector('#compatibility').classList.remove('hidden')
    document.querySelector('#loader').classList.add('hidden')
  })

}