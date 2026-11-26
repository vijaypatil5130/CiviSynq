CiviSynq frontend deployment notes

1. Upload this frontend folder to the existing GitHub repository, replacing the old frontend files.
2. In Render, create a Static Site connected to the CiviSynq repository.
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
3. Add this Static Site environment variable:
   VITE_API_URL = https://YOUR-BACKEND-SERVICE.onrender.com/api
   Replace the example host with the exact public URL of your live Render backend, followed by /api.
4. After the frontend deploys, copy its exact public URL and update the backend Web Service environment variable FRONTEND_URL to that frontend origin (no trailing slash), then redeploy the backend.
5. The file public/_redirects is included so React Router routes work on refresh.

Local development remains supported: when VITE_API_URL is not set, the app uses http://localhost:5000/api.
