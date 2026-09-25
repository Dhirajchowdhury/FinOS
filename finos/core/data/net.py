"""Network and HTTP helpers with credential sanitization for FinOS.

Prevents API tokens and query-parameter secrets from leaking into logs, stack traces,
or error strings upon network timeouts and exceptions.
"""

from __future__ import annotations

import requests


def get_scrubbed(
    url: str,
    *,
    params: dict | None = None,
    timeout: float = 15.0,
    secret: str = "",
) -> requests.Response:
    """Execute requests.get while scrubbing secret tokens from potential exceptions."""
    try:
        response = requests.get(url, params=params, timeout=timeout)
        response.raise_for_status()
        return response
    except requests.RequestException as exc:
        msg = str(exc)
        if secret:
            msg = msg.replace(secret, "***")
        raise type(exc)(msg) from None
