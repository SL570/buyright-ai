"""
Run once to populate Pinecone with BuyRight AI's knowledge base.
Usage: python -m scripts.seed_knowledge
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from services.vector import upsert_chunks

KNOWLEDGE: list[dict] = [
    # ── Amazon ────────────────────────────────────────────────────────────
    {
        "id": "amazon-return-policy",
        "category": "policy",
        "text": (
            "Amazon return policy: Most items sold by Amazon.com can be returned within 30 days "
            "of receipt of shipment. Items fulfilled by third-party sellers have varying return "
            "windows. Amazon Fresh and Whole Foods items: 7 days. Electronics: 30 days (opened). "
            "Laptops and computers: 30 days. Jewelry and watches: 30 days. Baby items: 90 days. "
            "Amazon Renewed (refurbished): 90 days. You can initiate returns through the 'Returns "
            "Center' in your account without contacting support for most items."
        ),
    },
    {
        "id": "amazon-price-match",
        "category": "policy",
        "text": (
            "Amazon price match policy: Amazon does NOT officially offer price matching against "
            "other retailers. However, Amazon does have an 'A-to-z Guarantee' and adjusts prices "
            "dynamically. If you bought an item on Amazon and the price drops within 7 days, you "
            "can request a courtesy credit from Amazon customer service by chatting or calling — "
            "this is not guaranteed but works for Prime members about 60% of the time. Amazon "
            "tracks your orders: go to Your Account → Orders → the item → 'Get help with order' "
            "to request a price adjustment."
        ),
    },
    {
        "id": "amazon-prime-guarantee",
        "category": "policy",
        "text": (
            "Amazon Prime delivery guarantee: If your Prime order doesn't arrive by the promised "
            "date, Amazon will give you a 1-month free Prime extension or a $5-10 promotional "
            "credit. Contact customer service and say 'my Prime delivery was late' — they almost "
            "always honor this. For items marked 'Guaranteed by [date]', Amazon is legally bound "
            "to that date and must provide compensation if missed."
        ),
    },
    {
        "id": "amazon-negotiate",
        "category": "negotiation",
        "text": (
            "Negotiating with Amazon: Amazon's customer service can apply courtesy discounts in "
            "certain situations. Script: 'I've been a Prime member for X years and am considering "
            "canceling due to [issue]. Can you offer anything to retain my business?' Works best "
            "after a delivery problem, wrong item, or damaged product. Amazon reps have authority "
            "to give $5-$20 credits without manager approval. Escalate to a supervisor for larger "
            "amounts. Chat support converts better than phone for credits."
        ),
    },

    # ── Best Buy ──────────────────────────────────────────────────────────
    {
        "id": "bestbuy-return-policy",
        "category": "policy",
        "text": (
            "Best Buy return policy: Standard members have 15 days to return most items. "
            "My Best Buy Plus/Total members get 30 days. Major appliances: 15 days (all members). "
            "Opened software, games, movies: exchange only. Cell phones: 15 days. "
            "Holiday return policy: items purchased Oct 27-Jan 13 can be returned through Jan 13. "
            "Items must be in original packaging with all accessories. Open-box items can be "
            "returned but are subject to a restocking fee if opened further."
        ),
    },
    {
        "id": "bestbuy-price-match",
        "category": "policy",
        "text": (
            "Best Buy price match policy: Best Buy will match prices from Amazon, Walmart, Target, "
            "Costco, and other local retail competitors. Price match is available at time of "
            "purchase OR within 15 days after purchase. Script to use in-store: 'I see Amazon has "
            "this for $X right now — can you match that price?' Show the competitor's current "
            "price on your phone. Price match does NOT apply to: open-box items, clearance, "
            "Marketplace sellers, limited-quantity deals, or prices that require membership. "
            "Online orders: call 1-888-BEST-BUY or use chat."
        ),
    },
    {
        "id": "bestbuy-negotiate",
        "category": "negotiation",
        "text": (
            "Negotiating at Best Buy: Ask about open-box items — they're typically 10-15% cheaper "
            "and carry the same warranty. Ask the rep: 'Do you have any open-box versions of this?' "
            "For floor models: 'Is there a floor model discount available?' (usually 15-20% off). "
            "Bundle negotiation: 'If I buy the TV and the soundbar together, what's the best price "
            "you can do?' Associates have limited but real discount authority, especially end of "
            "month when they're hitting quotas. Geek Squad protection plan: always negotiable, "
            "push for 20-30% off the listed plan price."
        ),
    },

    # ── Walmart ───────────────────────────────────────────────────────────
    {
        "id": "walmart-return-policy",
        "category": "policy",
        "text": (
            "Walmart return policy: Most items can be returned within 90 days of purchase with "
            "receipt or order confirmation. Electronics and entertainment: 30 days. Cell phones "
            "and prepaid phones: 14 days (opened). Firearms: no returns. Marketplace sellers: "
            "varies by seller. Walmart+ members get free returns by mail (just drop off at FedEx). "
            "Without a receipt: Walmart can look up purchases made with a credit/debit card. "
            "Managers have authority to approve returns outside policy for good customers."
        ),
    },
    {
        "id": "walmart-price-match",
        "category": "policy",
        "text": (
            "Walmart price match policy: Walmart matches prices at checkout ONLY — they will not "
            "do post-purchase price matches. Competitors matched include: Amazon (for items "
            "fulfilled and sold by Amazon directly), Target, and local competitors. "
            "Walmart's Savings Catcher program ended in 2019. "
            "Online price match: for Walmart.com purchases, contact support within 7 days and "
            "show the lower price — this is a courtesy match, not guaranteed policy. "
            "Script: 'I see Walmart.com has this item listed at $X but the store price is $Y — "
            "can you honor the online price?'"
        ),
    },

    # ── Target ────────────────────────────────────────────────────────────
    {
        "id": "target-return-policy",
        "category": "policy",
        "text": (
            "Target return policy: Most items can be returned within 90 days. Target RedCard "
            "holders get an extra 30 days (120 days total). Electronics and entertainment: 30 days "
            "(15 days for Apple products). Opened music, movies, games: exchange only for same "
            "title. Without a receipt: Target can look up purchases made with Target RedCard, "
            "credit/debit card, or Target account. Limit of 3 no-receipt returns per year. "
            "Holiday returns: items purchased Oct 1-Dec 31 can be returned through Jan 31."
        ),
    },
    {
        "id": "target-price-match",
        "category": "policy",
        "text": (
            "Target price match policy: Target matches prices from Amazon, Walmart, and other "
            "select competitors both at time of purchase AND within 14 days after purchase. "
            "Also matches Target.com prices in-store and Target store prices online. "
            "RedCard holders automatically get 5% off, which stacks with price matching. "
            "Script: 'I purchased this item X days ago and I see it's now $Y at Amazon — "
            "can I get a price adjustment?' Bring the receipt or order number. Target Circle "
            "members can request price adjustments through the app within 14 days."
        ),
    },

    # ── Costco ────────────────────────────────────────────────────────────
    {
        "id": "costco-return-policy",
        "category": "policy",
        "text": (
            "Costco return policy: Costco has one of the best return policies in retail — most "
            "items can be returned at ANY time for a full refund (no time limit). Exceptions: "
            "Electronics and major appliances: 90 days. Cigarettes, alcohol: no returns. "
            "Diamonds over 1 carat: special return process. Costco will also reimburse you for "
            "Costco.com shipping on returned items. You do NOT need the original packaging for "
            "most returns. This policy is a major differentiator and is why Costco members are "
            "willing to pay the annual fee."
        ),
    },

    # ── Deal timing ───────────────────────────────────────────────────────
    {
        "id": "deal-timing-electronics",
        "category": "timing",
        "text": (
            "Best times to buy electronics: "
            "TVs: January (post-Super Bowl, retailers clear inventory), Black Friday, and "
            "when new models are announced (usually March-April and September). "
            "Laptops: Back to School (August), Black Friday, and January. "
            "Smartphones: when new models launch (September for iPhone, varies for Android) — "
            "previous-gen prices drop 15-25% immediately after new launch. "
            "Gaming consoles: Black Friday is the only reliable discount period; "
            "avoid launch dates. "
            "Headphones/audio: Black Friday and Amazon Prime Day (July). "
            "General electronics cycle: prices are highest at launch and drop ~20% every 6 months."
        ),
    },
    {
        "id": "deal-timing-appliances",
        "category": "timing",
        "text": (
            "Best times to buy home appliances: "
            "September-October: New models arrive, retailers discount last year's models 20-30%. "
            "Black Friday/Cyber Monday: Largest discount event of the year for appliances. "
            "Memorial Day and Labor Day weekends: 15-25% off at Home Depot, Lowe's, Best Buy. "
            "January: Post-holiday clearance on floor models. "
            "Refrigerators and washers: best prices in May (Mother's Day sales) and October. "
            "Air conditioners: buy in September-October when season ends (often 40% off). "
            "Dishwashers: best in September when new models arrive. "
            "Tip: retailers near the end of fiscal quarters (March, June, September, December) "
            "are more likely to negotiate on appliances to hit sales targets."
        ),
    },
    {
        "id": "deal-timing-general",
        "category": "timing",
        "text": (
            "General shopping timing strategy: "
            "January: Electronics, fitness equipment, furniture, holiday decor at 50-70% off. "
            "February: Mattresses (Presidents Day sales), Valentine's items post-holiday. "
            "March-April: Spring clothing, outdoor furniture. "
            "May: Major appliances (Memorial Day), mattresses, outdoor items. "
            "June-July: Amazon Prime Day (varies), outdoor furniture clearance. "
            "August: Back to School — laptops, tablets, school supplies, clothing. "
            "September-October: Appliances, grills (end of season), lawn equipment. "
            "November: Black Friday — electronics, toys, clothing, appliances. Best deals: "
            "70-inch+ TVs, laptops, gaming consoles, kitchen appliances. "
            "December: Toys (last-minute), gift cards at discount."
        ),
    },

    # ── Negotiation strategies ────────────────────────────────────────────
    {
        "id": "negotiation-general",
        "category": "negotiation",
        "text": (
            "General retail negotiation strategies: "
            "1. Always ask — 70% of people who ask for a discount get at least something. "
            "2. The walk-away: 'I really want this but that price is a bit high for me. "
            "Is there anything you can do?' Then stay silent — silence is powerful. "
            "3. Bundle for discount: buying multiple items together is the easiest way to get "
            "a discount at any retailer. "
            "4. End of month pressure: retail associates have monthly quotas. Ask on the 28th-31st. "
            "5. Floor models: always 15-25% off and just as good. Ask every time. "
            "6. Open-box: Best Buy, Costco, and Target all sell open-box items at 10-30% off "
            "with full or partial warranties. "
            "7. Loyalty leverage: 'I've been a customer for X years and spend $Y/year here.' "
            "8. Competitor price: have it ready on your phone, show it without being aggressive."
        ),
    },
    {
        "id": "negotiation-email-template",
        "category": "negotiation",
        "text": (
            "Email negotiation template for bulk/group discount requests: "
            "Subject: Bulk Purchase Inquiry — [Product Name] "
            "Body: 'Dear [Retailer] Sales Team, I am writing to inquire about pricing for a bulk "
            "purchase of [X units] of [product]. Our group of [N] committed buyers is ready to "
            "purchase within [timeframe] pending your best pricing. "
            "We are currently evaluating offers from [Competitor A] and [Competitor B] as well. "
            "A discount of [target %] would make [Retailer] our preferred vendor for this and "
            "future group purchases. Could you provide a quote? "
            "Best, [Name]' "
            "Key elements: specific quantity, specific timeframe, mention of competitors, "
            "implication of repeat business. Never reveal your maximum budget."
        ),
    },
    {
        "id": "credit-card-strategy",
        "category": "savings",
        "text": (
            "Credit card and cashback strategies for shopping: "
            "Best cards for retail: Chase Freedom Flex (5% on rotating quarterly categories "
            "including Amazon and Walmart), Citi Custom Cash (5% on top spend category), "
            "Amazon Prime Visa (5% at Amazon and Whole Foods, 2% at restaurants/gas). "
            "Cashback portals: Always start at Rakuten, TopCashback, or BeFrugal before "
            "visiting any retailer — earn 1-15% cashback stacked on top of card rewards. "
            "Price tracking: CamelCamelCamel for Amazon price history. Honey for automatic "
            "coupon codes. Google Shopping to compare current prices. "
            "Stack strategy: Rakuten portal (cashback) + store sale + credit card rewards + "
            "coupon code = sometimes 20-30% effective discount."
        ),
    },
    {
        "id": "collective-bargaining-strategy",
        "category": "strategy",
        "text": (
            "Collective bargaining strategy for group purchases: "
            "Most retailers will offer 10-30% discount for bulk orders of 5+ identical units. "
            "Best targets for group deals: electronics (TVs, laptops, gaming consoles), "
            "appliances, furniture, and seasonal items. "
            "Best retailers for bulk negotiations: Costco Business, Sam's Club, B&H Photo, "
            "Newegg Business, and smaller local retailers (most flexible). "
            "Best Buy has a formal business account program for group purchases. "
            "Key tactics: (1) All buyers must commit before approaching retailer. "
            "(2) Offer to pay all at once, not individually. "
            "(3) Request NET-30 or direct invoice rather than individual checkout. "
            "(4) Timing: approach near end of quarter when sales reps have targets. "
            "(5) Start at 20% below target and negotiate up. Always ask for free delivery."
        ),
    },
    {
        "id": "price-match-master-guide",
        "category": "policy",
        "text": (
            "Master price match guide across retailers: "
            "Target: matches Amazon, Walmart, local competitors — up to 14 days post-purchase. "
            "Best Buy: matches Amazon, Walmart, Target — at purchase or within 15 days. "
            "Walmart: at checkout only — matches Amazon (sold by Amazon), Target, local. "
            "Home Depot: matches any local retailer — at purchase AND within 30 days (10% off matched price). "
            "Lowe's: matches any retailer including online — within 30 days (5% off matched price). "
            "Costco: no price match policy with other retailers. "
            "Amazon: no official price match, but reps can give courtesy credits. "
            "How to ask: 'I see [Competitor] has this item for $X right now. Do you price match?' "
            "Always have the competitor's current price on your phone as proof."
        ),
    },
]


def main():
    print(f"Seeding {len(KNOWLEDGE)} knowledge chunks to Pinecone...")
    upsert_chunks(KNOWLEDGE)
    print("Done.")


if __name__ == "__main__":
    main()
