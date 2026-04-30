# WHOiSEE — Brain (project brief / context file / north star doc)

Living context for WHOiSEE as a managed artist.

---

## Who

Brett. Based in North Carolina. TENx10-managed. DSR label act.
Circus Records UK EP (notable release).
PRO: BMI. IPI: **unknown — exists in emails/contracts, not yet in DB.**

DB artist ID: `dcc18841-25d9-4d2b-9f14-d6e9f8e0660f`

---

## Key Gap

BMI IPI needs to be pulled from Gmail/contracts and entered:
```sql
UPDATE artists SET pro_affiliation = 'bmi', pro_ipi = '[IPI]'
WHERE id = 'dcc18841-25d9-4d2b-9f14-d6e9f8e0660f';
```

---

## Notes

- Social following larger than DirtySnatcha on TikTok
- Cross-promo opportunity: WHOiSEE feeds DirtySnatcha streams, DirtySnatcha feeds WHOiSEE social reach
