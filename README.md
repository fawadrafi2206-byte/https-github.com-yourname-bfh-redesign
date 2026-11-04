# Bahrain Financial Harbour: static redesign

A static version of the redesign of bfh.dorio.io. Plain HTML, CSS and JavaScript, no build step.

```
public/            everything that gets published
  index.html       the home page
  ar/index.html    Arabic hero (RTL), draft
  404.html
  assets/css       styles.css
  assets/js        main.js
  assets/img       photography and logo, resized from the live site
render.yaml        Render Blueprint (static site, publishes ./public)
```

## Run it locally

```bash
python3 -m http.server 4173 --directory public
```

Open http://localhost:4173.

## Deploy on Render

1. Push this repo to GitHub.
2. In Render choose **New > Blueprint** and pick the repo. `render.yaml` sets everything up.
   Or choose **New > Static Site** with build command `echo "no build"` and publish directory `public`.
3. Every push to the default branch redeploys.

## Review notes

Open the site with `?notes` (for example `/?notes`) to show the notes that mark placeholder data:
stats, availability and prices, and testimonials carried over from the current site.

## Before launch

- Confirm the official address. `6HQC+8FF, King Faisal Hwy` is a Plus Code, not a postal address.
- Confirm the phone number: the live header says +973 170 2600, the footer +973 1710 2600. This site uses the footer number.
- Confirm the figures (1.2+, 250+, 24.7+), units and sources.
- Replace placeholder availability, prices and testimonials with real, approved content.
- Get higher-resolution photography; several source images are small.
- Have the Arabic copy reviewed by a native speaker and translate the rest of the page.
- Remove `<meta name="robots" content="noindex">` when the site goes live.
- Fonts load from Google Fonts and smooth scroll (Lenis 1.1.20) from jsDelivr. Self-host both for production.
