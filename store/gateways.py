"""
Payment gateway layer.

Isolated from everything else on purpose: this module is the only place that
knows a gateway exists. The payment service, the order and the discount rules
all talk to the small interface below, so pointing Qandak at a different
provider later would not require touching any of them.

Currency is converted here and only here. The store keeps money in whole
tomans; ZarinPal's API expects rials. Ten tomans to a rial is a factor of ten,
applied once, in :func:`to_rial`, so no other module ever has to think about it.
"""

import json
import logging
import urllib.error
import urllib.request
from decimal import Decimal

logger = logging.getLogger(__name__)

# The store's money unit.
STORE_CURRENCY = "toman"
# The gateway's money unit.
GATEWAY_CURRENCY = "rial"
RIAL_PER_TOMAN = Decimal("10")

PRODUCTION_API_BASE = "https://payment.zarinpal.com"
SANDBOX_API_BASE = "https://sandbox.zarinpal.com"
START_PAY_PATH = "pg/StartPay/{authority}"

# Network calls to the gateway must never hang a request thread.
DEFAULT_TIMEOUT_SECONDS = 15


def to_rial(amount) -> int:
    """
    Convert a store amount (whole tomans) to the gateway unit (rial).

    Exact and lossless: the store holds whole tomans, so multiplying by ten
    gives a whole number of rials and no rounding is ever applied.
    """
    tomans = Decimal(amount)
    rials = tomans * RIAL_PER_TOMAN
    if rials != rials.to_integral_value():
        raise ValueError("Store amounts must be whole tomans to convert to rial.")
    return int(rials)


class GatewayError(Exception):
    """The gateway could not be reached or answered something unusable."""

    def __init__(self, message: str, code: str = "unavailable"):
        self.message = message
        self.code = code
        super().__init__(message)


class ZarinpalGateway:
    """
    ZarinPal v4 REST integration.

    Verified against the official sandbox endpoints:
      POST {base}/pg/v4/payment/request.json
      POST {base}/pg/v4/payment/verify.json
    A successful reply carries ``data.code == 100`` and an ``authority``; a
    failure carries ``errors.code``. The customer is sent to
    ``{base}/pg/StartPay/{authority}``.
    """

    name = "zarinpal"

    def __init__(self, merchant_id: str, base_url: str, timeout: int = DEFAULT_TIMEOUT_SECONDS):
        if not merchant_id:
            raise GatewayError("ZarinPal merchant id is not configured.", code="not_configured")
        self.merchant_id = merchant_id
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    # -- internals ------------------------------------------------------

    def _post(self, path: str, payload: dict) -> dict:
        url = f"{self.base_url}/{path}"
        body = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            url, data=body, headers={"Content-Type": "application/json"}, method="POST"
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                raw = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            # The gateway still returns a useful JSON body on 4xx.
            raw = exc.read().decode("utf-8", errors="replace")
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            # Never log the body or any credential, only the fact of the failure.
            logger.warning("ZarinPal %s unreachable: %s", path, exc.__class__.__name__)
            raise GatewayError("The payment gateway is unavailable.") from exc

        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            logger.warning("ZarinPal %s returned a non-JSON body", path)
            raise GatewayError("The payment gateway sent an unreadable reply.") from exc

    # -- interface ------------------------------------------------------

    def create_payment(self, *, amount, description, callback_url, mobile=None) -> str:
        """Start a payment and return the gateway's authority."""
        payload = {
            "merchant_id": self.merchant_id,
            "amount": to_rial(amount),
            "description": description[:200],
            "callback_url": callback_url,
        }
        if mobile:
            payload["metadata"] = {"mobile": mobile}

        reply = self._post("pg/v4/payment/request.json", payload)
        data = reply.get("data") or {}
        errors = reply.get("errors")

        if errors or data.get("code") != 100 or not data.get("authority"):
            code = (errors or {}).get("code") if isinstance(errors, dict) else None
            logger.warning("ZarinPal request rejected with code %s", code)
            raise GatewayError("The payment gateway refused the request.", code=str(code))

        return data["authority"]

    def verify_payment(self, *, authority, amount) -> dict:
        """
        Confirm a payment with the gateway.

        Returns the gateway's reference and card info on success. The amount is
        sent from our own record so the gateway performs the comparison; the
        result is checked again on our side before anything is marked paid.
        """
        payload = {
            "merchant_id": self.merchant_id,
            "amount": to_rial(amount),
            "authority": authority,
        }
        reply = self._post("pg/v4/payment/verify.json", payload)
        data = reply.get("data") or {}
        errors = reply.get("errors")

        if errors or data.get("code") != 100:
            code = (errors or {}).get("code") if isinstance(errors, dict) else None
            logger.info("ZarinPal verification returned code %s", code)
            raise GatewayError("The payment was not confirmed.", code=str(code))

        return {
            "reference": data.get("ref_id"),
            "card_pan": data.get("card_pan"),
            "fee": data.get("fee"),
        }

    def payment_url(self, authority: str) -> str:
        return f"{self.base_url}/{START_PAY_PATH.format(authority=authority)}"
