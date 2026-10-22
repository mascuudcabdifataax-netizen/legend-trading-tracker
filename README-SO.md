# LEGEND Trading Tracker — nooca koowaad

Tani waa **PWA web app** mobile-first oo Android lagu rakibi karo marka HTTPS lagu host-gareeyo. Waxa ku jira:
- Dashboard iyo $10,000 payout progress
- Journal: TP / SL / BE, pair, setup, xeerarka, psychology, lesson
- Tirinta 8-trade cycles iyo cycle review
- Account roadmap: $6k, $15k, $50k, $100k
- Risk guide: 1% challenge, 0.5% funded
- Xaddid 2 trades maalintii (app-ku wuxuu ku salaynayaa taariikhda trade-ka aad geliso)
- Local browser storage
- Ikhtiyaarka Supabase cloud sync, auth email/password, iyo RLS SQL setup
- PWA manifest/service worker

## Muhiim: maxaa hadda shaqaynaya?
App-ka waxa lagu isticmaali karaa local mode isla marka la furo, balse local mode xogtu waxay ku jirtaa browser-ka qalabkaas. Cloud sync wuxuu shaqaynayaa kaddib marka aad samaysato Supabase project, socodsiiso `supabase-setup.sql`, app-ka ku host-garayso HTTPS, kadibna ku geliso Supabase URL iyo public anon/publishable key ee Settings. **Ha gelin service-role key.**

## Sida telefoonka keliya loogu hawlgeliyo
1. Samee akoon GitHub (haddii aadan lahayn) browser-ka telefoonka.
2. Samee repository cusub oo la yiraahdo `legend-trading-tracker`, kuna upload-garee dhammaan faylasha ZIP-kan ku jira (marka hore ka fur ZIP-ka).
3. GitHub repository → Settings → Pages → Deploy from branch → `main` / root. Sug ilaa HTTPS website-kaagu soo baxo. Haddii deployment-kaagu isticmaalo subpath, `manifest.json` iyo service worker-ku waxay adeegsadaan relative paths.
4. Samee Supabase project. Dashboard-ka ka fur SQL Editor, ku paste-garee `supabase-setup.sql`, kadib Run.
5. Supabase → Project Settings / API: soo qaado Project URL iyo **publishable/anon key** (waligaa service-role/secret key ha isticmaalin).
6. Fur website-kaaga, taabo ⚙ Settings, geli URL iyo public key, Save cloud configuration.
7. Samee account email/password. Haddii email confirmation shidan yahay, xaqiiji email-kaaga; kadib Sign in.
8. Android Chrome menu (⋮) → **Add to Home screen** ama **Install app**.

## Xaddidaadaha noocan koowaad
- Ma aha trading bot, mana la xirna MT5/broker/prop firm; trades adigaa gacanta ku gelinaya.
- Win rate waxaa lagu xisaabiyaa TP marka loo eego TP+SL; BE laguma daro denominator-ka.
- Risk amount waa guide ku salaysan account size-ka la doortay, ma aha position-size calculator sax ah (taas waxay u baahan tahay entry, stop-loss, symbol/tick value iyo broker specifications).
- 8 trades waa qayb dib-u-eegis ah, ma aha caddeyn ku filan oo strategy edge lagu xaqiijiyo.
- Local records-ka hore si toos ah cloud uguma migrate-gareeyaan marka la login-gareeyo; ka hor xog muhiim ah gelinta, cloud setup-ka dhammaystir oo ku tijaabi hal trade iyo hal payout.
- Isticmaalka dhabta ah ka hor, ku tijaabi xog dummy ah oo hubi cloud auth/policies.
