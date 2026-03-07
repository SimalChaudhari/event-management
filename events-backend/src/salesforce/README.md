# Salesforce integration

This module syncs events and registrations from Salesforce (ISCA e-services) and pushes attendance back to Salesforce.

## Environment variables

Add to your `.env`:

```env
# Salesforce OAuth (password grant)
SALESFORCE_LOGIN_URL=https://test.salesforce.com
SALESFORCE_BASE_URL=https://eservices-isca--fuat.sandbox.my.site.com
SALESFORCE_CLIENT_ID=your_client_id
SALESFORCE_CLIENT_SECRET=your_client_secret
SALESFORCE_USERNAME=your_username
SALESFORCE_PASSWORD=your_password

# Optional: enable cron to sync events every 6 hours
SALESFORCE_SYNC_CRON_ENABLED=true
```

## APIs used

1. **POST** `{SALESFORCE_LOGIN_URL}/services/oauth2/token` – OAuth token (grant_type=password).
2. **GET** `{SALESFORCE_BASE_URL}/services/apexrest/EventInfo` – List of course instances/events.
3. **GET** `{SALESFORCE_BASE_URL}/services/apexrest/EventRegistrations?accountId=xxx` – Registrations for an account.
4. **GET** `.../ui-api/object-info/Course_Registration__c/picklist-values/.../Residential_Declaration__c` – Picklist (Singapore / Overseas / None).
5. **POST** `{SALESFORCE_BASE_URL}/services/apexrest/CourseRegistrationCreation` – Create registration.
6. **POST** `{SALESFORCE_BASE_URL}/services/apexrest/attendanceForEvent` – Mark attendance (`{ "registrationNumber": "..." }`).

## Backend endpoints (Admin JWT)

- **POST** `/api/salesforce/sync/events` – Sync events from EventInfo to local DB (eventCode = courseInstanceId).
- **POST** `/api/salesforce/sync/registrations/:accountId` – Sync users and registrations for a Salesforce account; creates users by email if missing.
- **GET** `/api/salesforce/picklist/residential-declaration?recordTypeId=...` – Get Residential Declaration picklist.
- **POST** `/api/salesforce/registration/create` – Create a course registration in Salesforce.
- **POST** `/api/salesforce/attendance` – Post attendance to Salesforce (body: `{ "registrationNumber": "a0ifV0000002HHjQAM" }`).

## Sync behaviour

- **Events:** Fetched from EventInfo. Stored with `eventCode = courseInstanceId`. New events are created; existing ones updated by eventCode. Default start/end date and time are set if not provided by SF.
- **Registrations:** For a given `accountId`, registrations are fetched. For each registration:
  - Event is matched by `eventCode = courseInstance.id`.
  - User is found by email or created (firstName/lastName from name, email, mobile, company).
  - RegisterEvent is created with `externalRegistrationId = reg.id`, `externalRegistrationName = reg.regNo`.
- **Attendance:** When check-in is done in our app (QR, manual, or share-link), if the registration has `externalRegistrationId`, attendance is pushed to Salesforce automatically (errors are logged, check-in still succeeds).

## Cron

If `SALESFORCE_SYNC_CRON_ENABLED=true`, events are synced every 6 hours.
