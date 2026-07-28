# Embedding the Start-Up Specialist Popup on Any Website

The popup is available as an iframe at:

```
https://cashtapaiaccess.com/embed/specialist-popup
```

Everything works exactly like in the app:

- **Criteria enforced server-side** — shows only to US/Canada IPs, Monday–Friday
  08:30am–5:30pm Pacific. Everyone else sees nothing (the iframe stays hidden).
- **10-minute countdown** with red urgency timer.
- **Click tracking** — every "Call Now" tap is recorded in the
  `specialist_popup_events` Supabase table (visitor country + device;
  `user_id` is empty for visitors who aren't logged into CashTap).
- **Close button** hides the popup (and tells your page to hide the iframe).

## Copy-paste snippet

Put this right before `</body>` on your website:

```html
<iframe
  id="cashtap-specialist-popup"
  src="https://cashtapaiaccess.com/embed/specialist-popup"
  title="CashTap AI Start-Up Specialist"
  style="position:fixed;inset:0;width:100%;height:100%;border:0;z-index:999999;display:none;background:transparent"
  allowtransparency="true"
></iframe>
<script>
  (function () {
    var frame = document.getElementById("cashtap-specialist-popup");
    window.addEventListener("message", function (e) {
      var d = e.data;
      if (d && d.type === "cashtap-specialist-popup") {
        frame.style.display = d.open ? "block" : "none";
      }
    });
  })();
</script>
```

How it behaves:

1. The iframe loads invisibly (`display:none`).
2. The popup checks eligibility against the CashTap server (DigitalOcean)
   using the **visitor's** IP (GeoIP → US/CA) and the current Pacific time.
3. If eligible, the iframe posts `{ type: "cashtap-specialist-popup", open: true }`
   and the snippet makes it visible, covering the page with the popup + dimmed
   backdrop.
4. When the visitor closes the popup (X, Escape, or backdrop) — or the business
   window ends — it posts `open: false` and the snippet hides the iframe again,
   returning the page to normal.

## Counting clicks

Same queries as the in-app popup (Supabase SQL Editor):

```sql
SELECT count(*) FROM specialist_popup_events WHERE event = 'cta_call_click';
```

Clicks from your website and from inside the CashTap app all land in the same
table.

## Notes

- The dismiss is per browser session (sessionStorage inside the iframe).
- `tel:` links work from iframes on phones — tapping the button opens the dialer.
- Do not add `X-Frame-Options`/`frame-ancestors` restrictions to the CashTap
  deployment for this route, or embedding will break.
