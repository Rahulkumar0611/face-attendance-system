# 🚀 Deploying Frontend to Vercel

Since you have deployed your backend to Hugging Face Spaces, follow these steps to deploy the frontend to Vercel.

## 1. Push Latest Code
I have updated the code to support environment variables. Push the changes:
```bash
git add .
git commit -m "🔧 Update frontend for Vercel deployment"
git push origin main
```

## 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New** > **Project**.
3. Import your GitHub repository: `Face-Recobnition-System`.
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (Important!)
5. **Environment Variables** (Expand section):
   - Key: `VITE_API_URL`
   - Value: `https://Fayasx-face-attendance-backend.hf.space` (Your backend URL)
   *(Note: Ensure there are no trailing slashes)*

6. Click **Deploy**.

## 🎉 That's it!
Your full stack application will be live.
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://Fayasx-face-attendance-backend.hf.space`
