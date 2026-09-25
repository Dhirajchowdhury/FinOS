import httpx
import re
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_e2e():
    print("--- Starting Live FinOS Authentication E2E Test ---")
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[1/6] Health check passed:", res.json())

    # 2. Request OTP code
    email = "live_test_user@finos.io"
    res = client.post("/auth/email/request-code", json={"email": email})
    assert res.status_code == 200, f"Request code failed: {res.text}"
    data = res.json()
    print(f"[2/6] Requested OTP for {email}:", data)
    assert "Verification code sent" in data["message"]
    assert "otp" not in data, "Security error: OTP was returned in API response!"

    # 3. Read OTP from dev_inbox.log
    with open("dev_inbox.log", "r", encoding="utf-8") as f:
        content = f.read()
    
    matches = re.findall(r"OTP Code:\s*(\d{6})", content)
    assert matches, "No OTP found in dev_inbox.log"
    otp_code = matches[-1]
    print(f"[3/6] Retrieved generated OTP from dev_inbox.log: {otp_code}")

    # 4. Verify wrong OTP first to test error handling
    wrong_res = client.post("/auth/email/verify-code", json={"email": email, "code": "000000"})
    assert wrong_res.status_code == 400
    print("[4/6] Wrong OTP successfully rejected:", wrong_res.json()["detail"])

    # 5. Verify correct OTP and verify session cookie
    verify_res = client.post("/auth/email/verify-code", json={"email": email, "code": otp_code})
    assert verify_res.status_code == 200, f"Verification failed: {verify_res.text}"
    verify_data = verify_res.json()
    print("[5/6] Verification successful, user authenticated:", verify_data["user"]["email"])
    assert "finos_session" in client.cookies, "HttpOnly session cookie was not set!"

    # 6. Verify /auth/me with session cookie
    me_res = client.get("/auth/me")
    assert me_res.status_code == 200, f"/auth/me failed: {me_res.text}"
    user = me_res.json()
    print("[6/6] /auth/me verified successfully:", user)
    assert user["email"] == email
    assert user["is_verified"] is True

    # 7. Logout and verify session termination
    logout_res = client.post("/auth/logout")
    assert logout_res.status_code == 200
    print("[Success] Logged out. Verifying cookie invalidation...")
    me_after = client.get("/auth/me")
    assert me_after.status_code == 401, "Session was not terminated after logout!"

    print("ALL LIVE TESTS PASSED! FinOS Authentication Gateway is 100% operational.")

if __name__ == "__main__":
    run_e2e()
