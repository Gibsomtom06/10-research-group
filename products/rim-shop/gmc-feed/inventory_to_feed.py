#!/usr/bin/env python3
"""
Turn WRS's inventory CSV into a Google Merchant Center RSS 2.0 feed.

Expected CSV columns:
    sku, finish, size, title, description, price, image_url, additional_image_urls (semicolon-separated),
    availability (in stock|out of stock|preorder), condition (refurbished|new), weight_lb, ready (yes|no)

Rows with ready=no are skipped (they're the "Not Ready" backlog).

Usage:
    python inventory_to_feed.py --in inventory.csv --out feed.xml
"""
import argparse
import csv
import html
from pathlib import Path
from datetime import datetime, timezone

GOOGLE_CATEGORY = ("Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts > "
                   "Motor Vehicle Wheel Systems > Motor Vehicle Wheels")


def escape(s: str) -> str:
    return html.escape(s or "", quote=True)


def item_xml(row: dict) -> str:
    addl = [u.strip() for u in (row.get("additional_image_urls") or "").split(";") if u.strip()]
    addl_xml = "\n".join(f"      <g:additional_image_link>{escape(u)}</g:additional_image_link>" for u in addl)
    return f"""    <item>
      <g:id>{escape(row['sku'])}</g:id>
      <title>{escape(row['title'])}</title>
      <description>{escape(row['description'])}</description>
      <link>https://wrs-mi.com/shop/{escape(row['sku'].lower())}</link>
      <g:image_link>{escape(row['image_url'])}</g:image_link>
{addl_xml}
      <g:availability>{escape(row.get('availability') or 'in stock')}</g:availability>
      <g:price>{escape(row['price'])} USD</g:price>
      <g:condition>{escape(row.get('condition') or 'refurbished')}</g:condition>
      <g:brand>OEM</g:brand>
      <g:mpn>{escape(row['sku'])}</g:mpn>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>{escape(GOOGLE_CATEGORY)}</g:google_product_category>
      <g:product_type>Refurbished OEM Wheels &gt; {escape(row.get('finish') or '')}</g:product_type>
      <g:shipping_weight>{escape(row.get('weight_lb') or '25')} lb</g:shipping_weight>
      <g:custom_label_0>finish:{escape((row.get('finish') or '').lower().replace(' ','-'))}</g:custom_label_0>
      <g:custom_label_1>size:{escape(row.get('size') or '')}</g:custom_label_1>
    </item>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", default="feed.xml")
    args = ap.parse_args()

    items = []
    skipped = 0
    with open(args.inp, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if (row.get("ready") or "yes").lower() == "no":
                skipped += 1
                continue
            items.append(item_xml(row))

    generated = datetime.now(timezone.utc).isoformat()
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Wheel Repair Specialists of Michigan — Refurbished OEM Wheels</title>
    <link>https://wrs-mi.com</link>
    <description>Refurbished OEM alloy wheels. Generated {generated}.</description>
{chr(10).join(items)}
  </channel>
</rss>
"""
    Path(args.out).write_text(xml, encoding="utf-8")
    print(f"wrote {len(items)} items to {args.out} (skipped {skipped} not-ready)")


if __name__ == "__main__":
    main()
