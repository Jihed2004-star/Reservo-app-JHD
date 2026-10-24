"""End-to-end check for POST /api/availability/intervals/remove.

Registers a throwaway provider, generates a week of hourly availability, then
removes a middle hour, an adjacent pair of hours, a whole day and finally tries
to remove a booked hour. Run with the API listening on API_BASE.
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
import uuid

API = os.environ.get("API_BASE", "http://localhost:5399")
PSQL = os.environ.get("PSQL", r"E:\PostgreSQL\18\bin\psql.exe")
PGENV = {**os.environ, "PGPASSWORD": "devpassword"}

failures = []


def call(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{API}{path}", data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as res:
            raw = res.read().decode()
            return res.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as err:
        raw = err.read().decode()
        try:
            return err.code, json.loads(raw) if raw else None
        except json.JSONDecodeError:
            return err.code, raw


def check(name, condition, detail=""):
    print(f"{'PASS' if condition else 'FAIL'}  {name}{'' if condition else '  <- ' + str(detail)}")
    if not condition:
        failures.append(name)


def psql(sql):
    subprocess.run(
        [PSQL, "-h", "127.0.0.1", "-p", "5432", "-U", "myapp_user", "-d", "myapp", "-c", sql],
        env=PGENV,
        check=True,
        capture_output=True,
    )


def login(email, password):
    status, body = call("POST", "/api/auth/login", body={"email": email, "password": password})
    assert status == 200, (status, body)
    return body["token"]


def slots_of(element_id):
    status, body = call("GET", f"/api/availability?elementId={element_id}")
    assert status == 200, (status, body)
    return [(s["startTime"], s["endTime"]) for s in body]


def cleanup(service_name, emails):
    """Bookings -> Services (cascades Elements -> Availabilities) -> Users."""
    psql(
        'DELETE FROM "Bookings" WHERE "ElementId" IN ('
        'SELECT "Id" FROM "Elements" WHERE "ServiceId" IN ('
        f"SELECT \"Id\" FROM \"Services\" WHERE \"Name\" = '{service_name}'));"
    )
    psql(f"DELETE FROM \"Services\" WHERE \"Name\" = '{service_name}';")
    psql("DELETE FROM \"Users\" WHERE \"Email\" IN ("
         + ", ".join(f"'{email}'" for email in emails) + ");")


stamp = uuid.uuid4().hex[:8]
provider_email = f"e2e.provider.{stamp}@example.com"
customer_email = f"e2e.customer.{stamp}@example.com"
password = "Test1234!"

for email in (provider_email, customer_email):
    status, body = call(
        "POST", "/api/auth/register",
        body={"email": email, "password": password, "fullName": f"E2E {stamp}"},
    )
    assert status == 200, (status, body)

psql(f"UPDATE \"Users\" SET \"Role\" = 'Provider' WHERE \"Email\" = '{provider_email}';")
provider_token = login(provider_email, password)
customer_token = login(customer_email, password)

status, categories = call("GET", "/api/categories")
assert status == 200 and categories, (status, categories)
category_id = categories[0]["id"]

status, service = call(
    "POST", "/api/services", provider_token,
    body={
        "categoryId": category_id,
        "name": f"E2E Service {stamp}",
        "description": "temporary",
        "isActive": True,
        "bookingUnit": "Hourly",
    },
)
assert status in (200, 201), (status, service)

status, element = call(
    "POST", "/api/elements", provider_token,
    body={
        "serviceId": service["id"],
        "name": f"E2E Element {stamp}",
        "orderIndex": 1,
        "price": 25,
        "attributes": {},
    },
)
assert status in (200, 201), (status, element)
element_id = element["id"]

# Monday 2026-07-20 .. Friday 2026-07-24, 08:00-17:00 UTC.
status, generated = call(
    "POST", "/api/availability/generate", provider_token,
    body={
        "elementId": element_id,
        "daysOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "startTime": "08:00:00",
        "endTime": "17:00:00",
        "fromDate": "2026-07-20",
        "toDate": "2026-07-24",
    },
)
check("generate 5 weekday slots", status == 200 and generated["slotsCreated"] == 5, (status, generated))
check("5 slots stored", len(slots_of(element_id)) == 5, slots_of(element_id))


# 1. Middle hour: 09:00-10:00 on Monday splits 08:00-17:00 into two rows.
status, res = call(
    "POST", "/api/availability/intervals/remove", provider_token,
    body={
        "elementId": element_id,
        "intervals": [{"startTime": "2026-07-20T09:00:00Z", "endTime": "2026-07-20T10:00:00Z"}],
    },
)
monday = [s for s in slots_of(element_id) if s[0].startswith("2026-07-20")]
check("middle hour -> trimmed", status == 200 and res["trimmedSlots"] == 1 and res["removedSlots"] == 0, (status, res))
check("middle hour -> split in two", len(monday) == 2, monday)
check(
    "middle hour -> 08-09 + 10-17",
    bool(monday) and monday[0][0][11:16] == "08:00" and monday[0][1][11:16] == "09:00"
    and monday[1][0][11:16] == "10:00" and monday[1][1][11:16] == "17:00",
    monday,
)
check("other days untouched", len(slots_of(element_id)) == 6, slots_of(element_id))

# 2. Adjacent selections merge: 13:00-14:00 + 14:00-15:00 -> one 2h gap.
status, res = call(
    "POST", "/api/availability/intervals/remove", provider_token,
    body={
        "elementId": element_id,
        "intervals": [
            {"startTime": "2026-07-21T13:00:00Z", "endTime": "2026-07-21T14:00:00Z"},
            {"startTime": "2026-07-21T14:00:00Z", "endTime": "2026-07-21T15:00:00Z"},
        ],
    },
)
tuesday = [s for s in slots_of(element_id) if s[0].startswith("2026-07-21")]
check("adjacent pair -> trimmed once", status == 200 and res["trimmedSlots"] == 1, (status, res))
check("adjacent pair -> 2 ranges", len(tuesday) == 2, tuesday)
check(
    "adjacent pair -> 08-13 + 15-17",
    len(tuesday) == 2 and tuesday[0][1][11:16] == "13:00" and tuesday[1][0][11:16] == "15:00",
    tuesday,
)

# 3. Whole day: remove everything still open on Wednesday.
wednesday = [s for s in slots_of(element_id) if s[0].startswith("2026-07-22")]
status, res = call(
    "POST", "/api/availability/intervals/remove", provider_token,
    body={"elementId": element_id, "intervals": [{"startTime": wednesday[0][0], "endTime": wednesday[0][1]}]},
)
check("whole day -> removed", status == 200 and res["removedSlots"] == 1, (status, res))
check("whole day -> no rows left", [s for s in slots_of(element_id) if s[0].startswith("2026-07-22")] == [], slots_of(element_id))


# 4. Confirmed booking inside the selection blocks the removal.
status, booking = call(
    "POST", "/api/bookings", customer_token,
    body={"elementId": element_id, "startTime": "2026-07-23T09:00:00Z", "endTime": "2026-07-23T10:00:00Z"},
)
assert status in (200, 201), (status, booking)

status, res = call(
    "POST", "/api/availability/intervals/remove", provider_token,
    body={"elementId": element_id, "intervals": [{"startTime": "2026-07-23T08:00:00Z", "endTime": "2026-07-23T12:00:00Z"}]},
)
check("booked hour -> 409", status == 409, (status, res))
check("booked hour -> conflict reported", bool(res and res.get("conflictingBookings")), res)
check(
    "booked hour -> availability intact",
    len([s for s in slots_of(element_id) if s[0].startswith("2026-07-23")]) == 1,
    slots_of(element_id),
)

# 5. Removing an hour that is free next to the booking still works.
status, res = call(
    "POST", "/api/availability/intervals/remove", provider_token,
    body={"elementId": element_id, "intervals": [{"startTime": "2026-07-23T16:00:00Z", "endTime": "2026-07-23T17:00:00Z"}]},
)
thursday = [s for s in slots_of(element_id) if s[0].startswith("2026-07-23")]
check("free hour next to booking -> ok", status == 200 and res["trimmedSlots"] == 1, (status, res))
check("free hour next to booking -> ends 16:00", bool(thursday) and thursday[-1][1][11:16] == "16:00", thursday)

# 6. Validation and ownership.
status, res = call("POST", "/api/availability/intervals/remove", provider_token,
                   body={"elementId": element_id, "intervals": []})
check("empty intervals -> 400", status == 400, (status, res))

status, res = call("POST", "/api/availability/intervals/remove", provider_token,
                   body={"elementId": element_id,
                         "intervals": [{"startTime": "2026-07-24T10:00:00Z", "endTime": "2026-07-24T09:00:00Z"}]})
check("end before start -> 400", status == 400, (status, res))

status, res = call("POST", "/api/availability/intervals/remove", customer_token,
                   body={"elementId": element_id,
                         "intervals": [{"startTime": "2026-07-24T09:00:00Z", "endTime": "2026-07-24T10:00:00Z"}]})
check("customer forbidden -> 403", status == 403, (status, res))

status, res = call("POST", "/api/availability/intervals/remove", provider_token,
                   body={"elementId": element_id,
                         "intervals": [{"startTime": "2027-01-01T09:00:00Z", "endTime": "2027-01-01T10:00:00Z"}]})
check("no overlap -> 404", status == 404, (status, res))

print()
print("FAILURES:", failures if failures else "none")

if "--keep" not in sys.argv:
    cleanup(f"E2E Service {stamp}", [provider_email, customer_email])
    print("cleaned up test data")

raise SystemExit(1 if failures else 0)
