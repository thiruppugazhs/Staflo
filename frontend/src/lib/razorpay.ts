import { api } from '../api/client'

declare global {
  interface Window {
    Razorpay: any
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true)
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export interface CheckoutOptions {
  planName: string
  amountInINR: number // e.g. 99 for ₹99
  companyName?: string
  userEmail?: string
  userPhone?: string
  onSuccess?: (response: any) => void
  onError?: (error: any) => void
}

export async function openRazorpayCheckout(opts: CheckoutOptions) {
  const loaded = await loadRazorpayScript()
  if (!loaded) {
    throw new Error('Razorpay SDK failed to load. Please check your internet connection.')
  }

  // 1. Create order on backend
  const amountInPaise = Math.round(opts.amountInINR * 100)
  const { data: order } = await api.post('/payments/create-order', {
    amount: amountInPaise,
    currency: 'INR',
    notes: {
      plan: opts.planName,
      company: opts.companyName || 'Staflo Organization',
    },
  })

  // 2. Fetch Razorpay key
  const { data: config } = await api.get('/payments/config')
  const key = config.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TUjXmrPNGhYVpq'

  // 3. Open Razorpay Checkout modal
  const rzpOptions = {
    key: key,
    amount: order.amount,
    currency: order.currency,
    name: 'Staflo HRMS',
    description: `${opts.planName} Plan Subscription`,
    order_id: order.id,
    image: '/logo.svg',
    prefill: {
      name: opts.companyName || 'Staflo User',
      email: opts.userEmail || '',
      contact: opts.userPhone || '',
    },
    theme: {
      color: '#004E72',
    },
    handler: async function (response: {
      razorpay_payment_id: string
      razorpay_order_id: string
      razorpay_signature: string
    }) {
      try {
        // 4. Verify signature on backend
        const { data: verifyResult } = await api.post('/payments/verify', {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          plan_name: opts.planName,
        })
        if (opts.onSuccess) {
          opts.onSuccess(verifyResult)
        }
      } catch (err: any) {
        if (opts.onError) {
          opts.onError(err.response?.data?.detail || err.message || 'Payment verification failed')
        }
      }
    },
    modal: {
      ondismiss: function () {
        if (opts.onError) {
          opts.onError('Payment modal closed by user')
        }
      },
    },
  }

  const rzp = new window.Razorpay(rzpOptions)
  rzp.open()
}
