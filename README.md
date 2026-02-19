# SkillSwap for Survival

A hyperlocal crisis skill-exchange network that helps dispatch nearby volunteers by skill and **live location**.

## What it does

- Volunteers register with name, phone, skills, and geolocation.
- People in emergencies create alerts with required skill + their current location.
- Backend finds nearby matching volunteers and generates dispatch notifications containing:
  - requester location coordinates
  - map link for the emergency
  - volunteer distance to emergency

## Run

```bash
npm start
```

Then open `http://localhost:3000`.

## Test

```bash
npm test
```
