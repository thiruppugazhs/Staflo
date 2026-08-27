import hmac
import hashlib
import httpx
from ..core.config import settings

class RazorpayService:
    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.base_url = "https://api.razorpay.com/v1"

    async def create_order(self, amount: int, currency: str = "INR", receipt: str = None, notes: dict = None) -> dict:
        """
        Creates a Razorpay order.
        amount should be in smallest currency unit (e.g. paise for INR: 100 INR = 10000).
        """
        if not self.key_id or not self.key_secret:
            raise ValueError("Razorpay credentials are not configured.")

        payload = {
            "amount": int(amount),
            "currency": currency,
            "receipt": receipt or f"rcpt_{hashlib.md5(str(amount).encode()).hexdigest()[:8]}",
            "notes": notes or {}
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/orders",
                auth=(self.key_id, self.key_secret),
                json=payload,
                timeout=15.0
            )
            response.raise_for_status()
            return response.json()

    def verify_payment_signature(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        """
        Verifies the authenticity of a Razorpay payment signature using HMAC SHA256.
        """
        if not self.key_secret:
            return False

        message = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        generated_signature = hmac.new(
            self.key_secret.encode("utf-8"),
            message,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(generated_signature, razorpay_signature)

razorpay_service = RazorpayService()
