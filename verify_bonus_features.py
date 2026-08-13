#!/usr/bin/env python3
"""
Automated Test Suite for MeetClone Bonus Features:
- Phase 1: Auth (Signup, Login, JWT verification, Anonymous default user fallback)
- Phase 2: Host Controls (Lock meeting, locked room validation, join rejection)
"""

import sys
import requests

BASE_URL = "http://localhost:8000/api"

def main():
    print("=" * 60)
    print("      MEETCLONE BONUS FEATURES AUTOMATED TEST SUITE     ")
    print("=" * 60)

    # 1. Test Signup
    signup_payload = {
        "name": "Bonus Feature Tester",
        "email": "tester_bonus@meetclone.dev",
        "password": "SecurePassword123!"
    }

    print("\n[TEST 1] POST /api/auth/signup")
    res = requests.post(f"{BASE_URL}/auth/signup", json=signup_payload)
    if res.status_code == 400 and "already registered" in res.text:
        print(" -> User already exists. Testing Login next.")
    else:
        assert res.status_code == 201, f"Signup failed: {res.status_code} - {res.text}"
        data = res.json()
        assert "token" in data, "Token missing in signup response"
        assert data["user"]["email"] == signup_payload["email"], "User email mismatch"
        print(f" -> PASSED (Created user '{data['user']['name']}', Token length: {len(data['token'])})")

    # 2. Test Login
    login_payload = {
        "email": "tester_bonus@meetclone.dev",
        "password": "SecurePassword123!"
    }
    print("\n[TEST 2] POST /api/auth/login")
    res = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.status_code} - {res.text}"
    login_data = res.json()
    token = login_data["token"]
    user_id = login_data["user"]["id"]
    print(f" -> PASSED (Logged in as '{login_data['user']['name']}')")

    # 3. Test Auth Me Endpoint with JWT Bearer Token
    print("\n[TEST 3] GET /api/auth/me (Authenticated with Bearer Token)")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert res.status_code == 200, f"Auth Me failed: {res.status_code} - {res.text}"
    assert res.json()["id"] == user_id, "User ID mismatch in authenticated /auth/me"
    print(f" -> PASSED (Authenticated user id: {user_id})")

    # 4. Test Legacy Anonymous Fallback
    print("\n[TEST 4] GET /api/meetings/me (Anonymous Guest Fallback)")
    res = requests.get(f"{BASE_URL}/meetings/me")
    assert res.status_code == 200, f"Default user fallback failed: {res.status_code}"
    print(f" -> PASSED (Fallback default user: '{res.json()['name']}')")

    # 5. Create Instant Meeting as Authenticated Host
    print("\n[TEST 5] POST /api/meetings/instant (Creating meeting as Authenticated Host)")
    res = requests.post(f"{BASE_URL}/meetings/instant", headers=headers)
    assert res.status_code == 201, f"Instant meeting creation failed: {res.status_code}"
    meeting = res.json()
    code = meeting["meeting_code"]
    clean_code = code.replace(" ", "")
    print(f" -> PASSED (Created meeting code: '{code}', Host: '{meeting['host']['name']}')")

    # 6. Lock Meeting
    print("\n[TEST 6] POST /api/meetings/{code}/lock (Locking Meeting)")
    res = requests.post(f"{BASE_URL}/meetings/{clean_code}/lock", headers=headers)
    assert res.status_code == 200, f"Lock meeting failed: {res.status_code} - {res.text}"
    lock_data = res.json()
    assert lock_data["is_locked"] is True, "Meeting should be locked"
    print(" -> PASSED (Meeting status is now LOCKED)")

    # 7. Validate Locked Meeting
    print("\n[TEST 7] GET /api/meetings/{code}/validate (Validating Locked Meeting)")
    res = requests.get(f"{BASE_URL}/meetings/{clean_code}/validate")
    assert res.status_code == 200, f"Validate endpoint failed: {res.status_code}"
    val_data = res.json()
    assert val_data["valid"] is False, "Locked meeting should return valid=False"
    assert "locked" in val_data["reason"].lower(), f"Unexpected reason: {val_data['reason']}"
    print(f" -> PASSED (Validation rejected locked meeting with reason: '{val_data['reason']}')")

    # 8. Attempt Joining Locked Meeting (Should fail with 403 Forbidden)
    print("\n[TEST 8] POST /api/meetings/{code}/join (Attempting to Join Locked Meeting)")
    join_payload = {"display_name": "Late Joiner"}
    res = requests.post(f"{BASE_URL}/meetings/{clean_code}/join", json=join_payload)
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}: {res.text}"
    print(f" -> PASSED (Join rejected with HTTP 403: '{res.json()['detail']}')")

    # 9. Unlock Meeting
    print("\n[TEST 9] POST /api/meetings/{code}/lock (Unlocking Meeting)")
    res = requests.post(f"{BASE_URL}/meetings/{clean_code}/lock", headers=headers)
    assert res.status_code == 200, f"Unlock failed: {res.status_code}"
    assert res.json()["is_locked"] is False, "Meeting should be unlocked"
    print(" -> PASSED (Meeting status is now UNLOCKED)")

    # 10. Join Unlocked Meeting
    print("\n[TEST 10] POST /api/meetings/{code}/join (Joining Unlocked Meeting)")
    res = requests.post(f"{BASE_URL}/meetings/{clean_code}/join", json=join_payload)
    assert res.status_code == 200, f"Join failed after unlock: {res.status_code} - {res.text}"
    print(f" -> PASSED (Participant successfully joined instance ID: '{res.json()['instance_id']}')")

    print("\n" + "=" * 60)
    print("     ALL BONUS FEATURE TESTS PASSED SUCCESSFULLY! 🚀    ")
    print("=" * 60)

if __name__ == "__main__":
    main()
