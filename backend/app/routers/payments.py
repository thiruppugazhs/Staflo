from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from ..services.razorpay_service import razorpay_service
from ..core.config import settings

router = APIRouter(prefix="/payments", tags=["payments"])

class CreateOrderRequest(BaseModel):
    amount: int  # in paise, e.g. 9900 = ₹99.00
    currency: str = "INR"
    receipt: Optional[str] = None
    notes: Optional[Dict[str, Any]] = None

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_name: Optional[str] = None

@router.get("/config")
async def get_payment_config():
    """Returns the public Razorpay Key ID for client-side checkout modal."""
    return {
        "key_id": settings.RAZORPAY_KEY_ID,
        "currency": "INR",
        "enabled": bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)
    }

@router.post("/create-order")
async def create_order(req: CreateOrderRequest):
    """Creates an order in Razorpay for subscription or tier upgrade."""
    try:
        order = await razorpay_service.create_order(
            amount=req.amount,
            currency=req.currency,
            receipt=req.receipt,
            notes=req.notes
        )
        return order
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create Razorpay order: {str(e)}"
        )

@router.post("/verify")
async def verify_payment(req: VerifyPaymentRequest):
    """Verifies the payment signature returned by the Razorpay checkout modal."""
    is_valid = razorpay_service.verify_payment_signature(
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        razorpay_signature=req.razorpay_signature
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature. Verification failed."
        )

    return {
        "success": True,
        "message": "Payment verified successfully",
        "order_id": req.razorpay_order_id,
        "payment_id": req.razorpay_payment_id,
        "plan_name": req.plan_name or "Standard Plan"
    }
