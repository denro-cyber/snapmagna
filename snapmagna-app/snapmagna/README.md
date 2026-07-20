# SnapMagna — Customer Photo Upload App 

Customer-facing web app: QR scan → upload photo → crop → preview → print order.

## Deploy to Vercel (free)

1. Push this folder to GitHub
2. Go to vercel.com → New Project → Import from GitHub
3. Select this repo → Deploy
4. Your live URL will be: https://snapmagna.vercel.app

## Embed in Shopify

In your Shopify theme editor → Product page → Custom liquid block:

```html
<div style="margin:16px 0">
  <a href="https://snapmagna.vercel.app" target="_blank"
     style="display:block;width:100%;padding:14px;text-align:center;
            background:#C4964A;color:#fff;border-radius:8px;
            font-size:15px;font-weight:500;text-decoration:none">
    Upload your photo
  </a>
  <p style="font-size:12px;color:#888;text-align:center;margin:8px 0 0">
    JPG, PNG or HEIC · min 750×750px for sharp prints
  </p>
</div>
```

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000
