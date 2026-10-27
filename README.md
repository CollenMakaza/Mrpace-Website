# Mr Pace Athletics Club website

Running club website for **Mr Pace** – Unit K Ext, Chitungwiza, Harare, Zimbabwe.

| Folder      | What it is                                   | Runs on                 |
|-------------|----------------------------------------------|-------------------------|
| `backend/`  | Node.js + Express API, database, emails, Paynow | http://localhost:5000 |
| `frontend/` | Public website (React + Vite)                | http://localhost:5173   |
| `admin/`    | Admin dashboard (React + Vite)               | http://localhost:5174   |

## 1. Install Node.js (one time)
Download the **LTS** version from https://nodejs.org and install it. Then close and reopen your terminal.
Check it worked: `node -v` should print v20 or newer.

## 2. Add your pictures
- Put the logo and club photos in `frontend/public/images/` – see the names in `PUT-YOUR-PICTURES-HERE.txt`.
- Copy the logo to `admin/public/images/logo.png` as well.
- Missing pictures show a red/black placeholder, so the site still works without them.

## 3. Set up the backend
```
cd backend
copy .env.example .env
npm install
npm run dev
```
Open `backend/.env` and set at least `JWT_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
The admin account is created automatically the first time the backend starts.

## 4. Start the website and the admin (two more terminals)
```
cd frontend
npm install
npm run dev
```
```
cd admin
npm install
npm run dev
```

## How registration works
1. A runner **signs up** with their email and logs in.
2. They pick an **upcoming race** and a distance.
3. They **pay**:
   - **EcoCash / OneMoney** – a PIN prompt is sent to their phone (via Paynow)
   - **Card / other** – Paynow's secure checkout page
   - **Manual** – they send money to the club's EcoCash/bank and type the transaction reference
4. The **admin verifies** the payment in *Admin → Registrations* and clicks **Verify & send ticket**.
5. The runner gets an **email ticket** with a QR code, ticket code and bib number.
6. On race day, use *Admin → Race-day check-in* to check the ticket code.

## Emails
Fill in the `SMTP_*` settings in `backend/.env` (for Gmail use an *App password*).
Until then, emails are saved as HTML files in `backend/outbox/` so you can test everything.

## Online payments (Paynow)
Create an integration at https://www.paynow.co.zw and put `PAYNOW_INTEGRATION_ID` and
`PAYNOW_INTEGRATION_KEY` in `backend/.env`. `PUBLIC_API_URL` must be the public internet address of the
backend so Paynow can report payment results. Without Paynow keys the site still works with manual payments.

## Data
Everything is stored in `backend/data/db.json` and uploaded photos in `backend/uploads/`. Back up both folders.

## Going live
- `npm run build` in `frontend/` and `admin/` creates a `dist/` folder for each – upload these to any static host
  (Netlify, Vercel, cPanel). Set `VITE_API_URL` to your backend address before building
  (for admin also `VITE_PUBLIC_SITE` = your website address).
- Run the backend on a Node host (Render, Railway, a VPS) with the same `.env`, and set `CLIENT_URL` / `ADMIN_URL`
  to the live website addresses.
