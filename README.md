# Bitespeed Identity Reconciliation Service

This project is a backend service designed to handle identity reconciliation for a platform like FluxKart.com. It consolidates customer contact information by identifying and linking contacts across different orders, even when they use varying email addresses or phone numbers.

## Test Link

Endpoint - [https://bitespeed-3ule.onrender.com/identify](https://bitespeed-3ule.onrender.com/identify)

## Table of Contents

- [Bitespeed Identity Reconciliation Service](#bitespeed-identity-reconciliation-service)
  - [Test Link](#test-link)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [The Problem Solved](#the-problem-solved)
  - [Core Features](#core-features)
  - [Tech Stack](#tech-stack)
  - [Prerequisites](#prerequisites)
  - [Setup and Installation](#setup-and-installation)
  - [Running the Application](#running-the-application)
  - [API Endpoint Documentation](#api-endpoint-documentation)
    - [/identify](#identify)
      - [Success Response (200 OK)](#success-response-200-ok)
      - [Error Response (400 Bad Request)](#error-response-400-bad-request)
  - [Testing Scenarios](#testing-scenarios)
  - [Author](#author)

## Overview

In many systems, a single customer can inadvertently create multiple profiles by using different contact details for various transactions. This service provides a centralized /identify endpoint that receives an email and/or a phone number and returns a consolidated contact profile, ensuring a unified view of the customer.

## The Problem Solved

This service addresses the challenge of fragmented customer identities. By linking disparate contact entries, it enables a business to:

- Achieve a 360-degree view of its customers.
- Prevent duplicate records.
- Provide a consistent and personalized user experience.
- Analyze customer behavior and loyalty accurately.

## Core Features

- **Identify Contacts:** Finds existing contacts based on email or phone number.
- **Create New Contacts:** Creates a new primary contact if no existing records match.
- **Link Secondary Contacts:** Creates a secondary contact when a request shares information with an existing contact but also contains new details.
- **Merge Identities:** Merges two previously separate primary contacts into a single identity when new evidence links them. The oldest contact becomes the primary one.

## Tech Stack

- **Backend:** Node.js with Express.js
- **Database:** Supabase (PostgreSQL)
- **Client:** @supabase/supabase-js for database interaction
- **Environment Variables:** dotenv

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)
- A free [Supabase](https://supabase.com/) account

## Setup and Installation

**1\. Clone the Repository (or Create Files)**

Clone or Fork this github repository.

**2\. Install Dependencies**

Navigate to the project's root directory and run:

`npm install`

**3\. Set Up the Supabase Database**

- Log in to your Supabase account and create a new project.
- Go to the **SQL Editor**.
- Copy and run the following SQL script to create the Contact table and required types:

```sql

CREATE TYPE link_precedence AS ENUM ('primary', 'secondary');

CREATE TABLE "Contact" (
    id SERIAL PRIMARY KEY,
    "phoneNumber" VARCHAR(255),
    email VARCHAR(255),
    "linkedId" INT,
    "linkPrecedence" link_precedence NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ,
    FOREIGN KEY ("linkedId") REFERENCES "Contact"(id)
);

CREATE INDEX idx_contact_email ON "Contact"(email);
CREATE INDEX idx_contact_phonenumber ON "Contact"("phoneNumber");
CREATE INDEX idx_contact_linkedid ON "Contact"("linkedId");
```

**4\. Configure Environment Variables**

- In your Supabase project, go to **Project Settings > API**.
- Find your **Project URL** and **anon (public) key**.
- In the root of your local project, create a file named .env.
- Add your Supabase credentials to the .env file:

```js
SUPABASE_URL = "YOUR_PROJECT_URL";
SUPABASE_KEY = "YOUR_PROJECT_ANON_KEY";
```

## Running the Application

Start the server with the following command:

`npm start`

The server will be running on http://localhost:3000 (or the port you configured).

## API Endpoint Documentation

### /identify

Identifies a customer and returns their consolidated contact information.

- **URL:** /identify
- **Method:** POST
- **Body (raw JSON):**

```json
{
  "email"?: "string",
  "phoneNumber"?: "string"
}
```

#### Success Response (200 OK)

```json
{
  "contact": {
    "primaryContatctId": number,
    "emails": ["string"],
    "phoneNumbers": ["string"],
    "secondaryContactIds": [number]
  }
}
```

#### Error Response (400 Bad Request)

If both email and phoneNumber are missing from the request.

```json
{
  "error": "Either email or phoneNumber must be provided."
}
```

## Testing Scenarios

Use an API client like Postman or curl to test the following flows. **Ensure your database is empty before starting.**

**1\. Create a Primary Contact**

```
{ "email": "priya@example.com", "phoneNumber": "111111" }
```

- **Result:** A new primary contact is created.

**2\. Create a Secondary Contact**

```
{ "email": "priya.s@work.com", "phoneNumber": "111111" }
```

- **Result:** A new secondary contact is created and linked to the first one. The response will show both emails.

**3\. Create a Second, Unrelated Primary Contact**

```
{ "email": "rohan@example.com", "phoneNumber": "222222" }
```

- **Result:** A new, separate primary contact is created.

**4\. Merge the Two Primary Contacts**

```
{ "email": "priya@example.com", "phoneNumber": "222222" }
```

- **Result:** The system identifies that these two contacts are the same person. The older contact remains primary, and the newer one becomes secondary. The response will show all emails and phone numbers consolidated.

## Author

[Balram Mardi](https://github.com/BalramMardi)
