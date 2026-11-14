# Pain is the Integrand

給一路相信我們的你。116 學測數 A、分科數甲倒數與 Plugin 使用指南。

## Website

https://jasoart.github.io/Pain-is-the-integrand/

Buildless HTML, CSS and native JavaScript modules. No package installation, external fonts or client libraries are required. GitHub Pages publishes the root of `main` through the repository's existing Pages build and deployment. `.nojekyll` keeps the assets unmodified.

## Local development

Run `npm run dev`, then open http://localhost:4173/ . Native modules require an HTTP server instead of opening `index.html` as a file.

Run `npm test` (Node.js 18.17+). Tests cover countdown boundaries, explicit Taiwan timezone offsets, elapsed-time recovery, invalid preferences, and UTF-8 iCalendar exports.

## Source layout

- `index.html`: readable letter and service notice, including static exam dates when JavaScript is disabled.
- `assets/styles.css`: responsive editorial layout, keyboard focus, reduced motion and print styles.
- `assets/app.mjs`: exam switching, guarded preference storage, clock lifecycle, clipboard feedback and calendar downloads.
- `assets/countdown.mjs`: exam configuration, pure time calculations and iCalendar export.
- `assets/brand.png`: the original supplied badge, referenced once as a shared asset rather than embedded three times.

## Dates and maintenance

The countdown uses full 24-hour days plus hours/minutes/seconds, rounded up to the next second. It is recalculated from the device clock each tick, pauses when the page is hidden, and never displays a negative value. The letter's inline wording always refers to GSAT; switching the card does not change the letter's subject. A saved exam choice is optional and safely ignored if browser storage is unavailable.

Exam configuration lives in `assets/countdown.mjs`. If official schedules change, update it together with the static `<time>` and `<noscript>` content in `index.html`. The device clock must be accurate.

Verified on 2026-11-14 against:

- [大考中心《116 學年度考試簡章》](https://www.ceec.edu.tw/files/file_pool/1/0q215601929252011195/116學年度簡章.pdf), printed pages 3 and 9: GSAT Math A 2027-01-22 09:20–11:00; AST Math A 2027-07-10 14:00–15:20 (Asia/Taipei).
- [OpenAI Custom GPT retirement and migration FAQ](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq).
- [Plugins in ChatGPT](https://help.openai.com/en/articles/20001256-plugins-in-chatgpt).

The service's statement that its Plugin migration is complete is retained from the supplied notice. Plugin visibility and installation depend on each reader's account and sharing permissions; the ChatGPT link opens ChatGPT rather than claiming to install or activate the Plugin.
