import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# -----------------------------------------------------------------------------
# CONSTANTS & PALETTE (Matching Provenance Website Theme)
# -----------------------------------------------------------------------------
# Website Theme Colors:
# Accent: #1E5F74 (Deep Teal)
# Accent Hover: #154756
# Accent Light: #EAF3F6
# Primary: #1A1A1A (Charcoal / Dark Slate)
# Surface: #FAFAFA
# Surface Card: #FFFFFF
# Border: #E2E8F0 / #E5E7EB
# Emerald (Verified): #059669 / Light #ECFDF5
# Amber (Warning/Unverified): #D97706 / Light #FEF3C7
# Red (Revoked): #DC2626 / Light #FEE2E2

COLOR_TEAL_PRIMARY = RGBColor(30, 95, 116)     # #1E5F74 (Main Brand Accent)
COLOR_TEAL_DARK    = RGBColor(21, 71, 86)      # #154756 (Deep Teal)
COLOR_TEAL_LIGHT   = RGBColor(234, 243, 246)   # #EAF3F6 (Pill/Badge Background)
COLOR_DARK_BG      = RGBColor(15, 23, 42)      # #0F172A (Deep Slate Dark)
COLOR_DARK_SURFACE = RGBColor(26, 36, 56)      # #1A2438 (Dark Card Surface)
COLOR_CHARCOAL     = RGBColor(26, 26, 26)      # #1A1A1A (Primary Text Dark)
COLOR_LIGHT_BG     = RGBColor(248, 250, 252)   # #F8FAFC (Light Page Surface)
COLOR_WHITE        = RGBColor(255, 255, 255)   # #FFFFFF
COLOR_BORDER       = RGBColor(226, 232, 240)   # #E2E8F0 (Card Border)
COLOR_MUTED_TEXT   = RGBColor(100, 116, 139)   # #64748B (Secondary Text)
COLOR_EMERALD      = RGBColor(5, 150, 105)     # #059669 (Verified Green)
COLOR_EMERALD_BG   = RGBColor(236, 253, 245)   # #ECFDF5
COLOR_AMBER        = RGBColor(217, 119, 6)     # #D97706 (Warning Amber)
COLOR_AMBER_BG     = RGBColor(254, 243, 199)   # #FEF3C7
COLOR_CRIMSON      = RGBColor(220, 38, 38)     # #DC2626 (Revoked Red)
COLOR_CRIMSON_BG   = RGBColor(254, 226, 226)   # #FEE2E2
COLOR_BLUE         = RGBColor(37, 99, 235)     # #2563EB (Tech Blue)

FONT_HEADING = "Helvetica"
FONT_BODY = "Arial"

WORKSPACE_ROOT = "/Users/sai/Provenance"

def create_presentation():
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Helper: Set slide background color
    def set_slide_background(slide, color):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = color

    # Helper: Add standard light slide header
    def add_light_header(slide, category, title, subtitle=None):
        set_slide_background(slide, COLOR_LIGHT_BG)
        
        # Category Pill
        pill_shape = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(0.8), Inches(0.45), Inches(3.8), Inches(0.32)
        )
        pill_shape.fill.solid()
        pill_shape.fill.fore_color.rgb = COLOR_TEAL_LIGHT
        pill_shape.line.color.rgb = COLOR_TEAL_PRIMARY
        pill_shape.line.width = Pt(1)
        
        tf = pill_shape.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.text = f"✦  {category.upper()}"
        p.font.name = FONT_HEADING
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEAL_PRIMARY
        p.alignment = PP_ALIGN.CENTER
        
        # Title
        title_box = slide.shapes.add_textbox(
            Inches(0.8), Inches(0.82), Inches(11.7), Inches(0.65)
        )
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title
        p_title.font.name = FONT_HEADING
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_CHARCOAL

        # Subtitle
        if subtitle:
            sub_box = slide.shapes.add_textbox(
                Inches(0.8), Inches(1.42), Inches(11.7), Inches(0.35)
            )
            tf_sub = sub_box.text_frame
            tf_sub.word_wrap = True
            p_sub = tf_sub.paragraphs[0]
            p_sub.text = subtitle
            p_sub.font.name = FONT_BODY
            p_sub.font.size = Pt(11.5)
            p_sub.font.color.rgb = COLOR_MUTED_TEXT

        # Bottom Footer Bar
        footer_line = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE,
            Inches(0.8), Inches(7.0), Inches(11.733), Inches(0.02)
        )
        footer_line.fill.solid()
        footer_line.fill.fore_color.rgb = COLOR_BORDER
        footer_line.line.fill.background()

        footer_text = slide.shapes.add_textbox(
            Inches(0.8), Inches(7.05), Inches(6.0), Inches(0.3)
        )
        tf_f = footer_text.text_frame
        p_f = tf_f.paragraphs[0]
        p_f.text = "PROVENANCE  |  Tamper-Evident Credential-Verification Platform"
        p_f.font.name = FONT_BODY
        p_f.font.size = Pt(9)
        p_f.font.color.rgb = COLOR_MUTED_TEXT

    # Helper: Create styled container card
    def add_card(slide, left, top, width, height, bg_color=COLOR_WHITE, border_color=COLOR_BORDER, border_width=1):
        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            left, top, width, height
        )
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(border_width)
        else:
            card.line.fill.background()
        return card

    # Helper: Add speaker notes
    def set_speaker_notes(slide, notes_text):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = notes_text

    # =========================================================================
    # SLIDE 1: TITLE / HERO SLIDE (Dark Luxury Slate / Teal Theme)
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1, COLOR_DARK_BG)

    # Ambient Accent Glow Shape (Top Right & Bottom Left)
    glow1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.12))
    glow1.fill.solid()
    glow1.fill.fore_color.rgb = COLOR_TEAL_PRIMARY
    glow1.line.fill.background()

    # Category Pill
    pill1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.1), Inches(3.9), Inches(0.38))
    pill1.fill.solid()
    pill1.fill.fore_color.rgb = RGBColor(23, 42, 69)
    pill1.line.color.rgb = COLOR_TEAL_PRIMARY
    pill1.line.width = Pt(1.5)
    tf1 = pill1.text_frame
    p1 = tf1.paragraphs[0]
    p1.text = "✦  TAMPER-EVIDENT CREDENTIAL RECORDS"
    p1.font.name = FONT_HEADING
    p1.font.size = Pt(10)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(86, 204, 242)
    p1.alignment = PP_ALIGN.CENTER

    # Hero Title
    title_box1 = slide1.shapes.add_textbox(Inches(1.2), Inches(1.65), Inches(11.0), Inches(1.6))
    tf_t1 = title_box1.text_frame
    tf_t1.word_wrap = True
    
    p_t1 = tf_t1.paragraphs[0]
    p_t1.text = "PROVENANCE"
    p_t1.font.name = FONT_HEADING
    p_t1.font.size = Pt(44)
    p_t1.font.bold = True
    p_t1.font.color.rgb = COLOR_WHITE
    
    p_t1_sub = tf_t1.add_paragraph()
    p_t1_sub.text = "Verifiable Academic & Professional Credentials with Zero Doubt"
    p_t1_sub.font.name = FONT_HEADING
    p_t1_sub.font.size = Pt(20)
    p_t1_sub.font.color.rgb = RGBColor(148, 163, 184)
    p_t1_sub.space_before = Pt(8)

    # Divider
    div1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.2), Inches(3.45), Inches(10.9), Inches(0.02))
    div1.fill.solid()
    div1.fill.fore_color.rgb = RGBColor(51, 65, 85)
    div1.line.fill.background()

    # 4 Key Value Pillar Cards
    pillars = [
        ("Deterministic Forensics", "6-stage multi-layered file inspection analyzing metadata gaps, tool signatures, OCR, and pHash templates.", COLOR_TEAL_PRIMARY, RGBColor(86, 204, 242)),
        ("Per-Issuer Hash Chain", "Append-only SHA-256 cryptographic ledger with PostgreSQL advisory locks guaranteeing tamper-evidence.", COLOR_EMERALD, RGBColor(110, 231, 183)),
        ("Anti-SSRF Connectors", "Strict constant-host public registry lookups (e.g. Coursera) with zero arbitrary OCR link crawling.", COLOR_BLUE, RGBColor(147, 197, 253)),
        ("Zero Data Leakage", "Public verifiers and candidate showcases surface verified signals while protecting sensitive PII and keys.", COLOR_AMBER, RGBColor(252, 211, 77))
    ]

    card_w = Inches(2.55)
    card_gap = Inches(0.23)
    card_top = Inches(3.7)
    card_h = Inches(2.6)

    for i, (p_title, p_desc, bar_col, text_col) in enumerate(pillars):
        left_pos = Inches(1.2) + i * (card_w + card_gap)
        c = add_card(slide1, left_pos, card_top, card_w, card_h, bg_color=COLOR_DARK_SURFACE, border_color=RGBColor(51, 65, 85))
        
        # Color bar indicator on top of card
        c_bar = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_pos, card_top, card_w, Inches(0.06))
        c_bar.fill.solid()
        c_bar.fill.fore_color.rgb = bar_col
        c_bar.line.fill.background()

        tb = slide1.shapes.add_textbox(left_pos + Inches(0.18), card_top + Inches(0.18), card_w - Inches(0.36), card_h - Inches(0.36))
        tf_c = tb.text_frame
        tf_c.word_wrap = True
        
        p_ct = tf_c.paragraphs[0]
        p_ct.text = p_title
        p_ct.font.name = FONT_HEADING
        p_ct.font.size = Pt(13)
        p_ct.font.bold = True
        p_ct.font.color.rgb = text_col
        
        p_cd = tf_c.add_paragraph()
        p_cd.text = p_desc
        p_cd.font.name = FONT_BODY
        p_cd.font.size = Pt(10)
        p_cd.font.color.rgb = RGBColor(203, 213, 225)
        p_cd.space_before = Pt(8)

    # Slide 1 Footer
    foot1 = slide1.shapes.add_textbox(Inches(1.2), Inches(6.8), Inches(10.9), Inches(0.35))
    tf_f1 = foot1.text_frame
    p_f1 = tf_f1.paragraphs[0]
    p_f1.text = "Provenance Platform Overview  •  Full-Stack Monorepo (Next.js App Router + Express + PostgreSQL + Prisma)"
    p_f1.font.name = FONT_BODY
    p_f1.font.size = Pt(10)
    p_f1.font.color.rgb = RGBColor(100, 116, 139)

    set_speaker_notes(slide1, """Welcome to the Provenance platform presentation.
Provenance is a high-assurance, tamper-evident credential verification platform designed to eliminate academic and professional credential fraud.
Unlike traditional background check services that rely on slow phone calls, opaque black-box AI scores, or insecure PDF scrapers, Provenance pairs deterministic self-upload document forensics with an append-only per-issuer cryptographic hash chain.
In this deck, we will explore the crisis in credential integrity, the 6-stage forensics pipeline, the cryptographic hash ledger, architectural anti-SSRF protections, and the multi-role user experience.""")

    # =========================================================================
    # SLIDE 2: EXECUTIVE OVERVIEW & PLATFORM MISSION
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_light_header(slide2, "Platform Vision & Value Proposition", "Restoring Absolute Trust in Academic & Professional Records", "Provenance eliminates the friction, insecurity, and ambiguity of modern background checks.")

    # Left Column: The Problem & The Solution Card
    col_w = Inches(5.6)
    left1 = Inches(0.8)
    left2 = Inches(6.9)
    top_pos = Inches(1.85)
    card_h2 = Inches(4.9)

    # Card Left: Core Philosophy
    add_card(slide2, left1, top_pos, col_w, card_h2, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
    # Left accent strip
    strip1 = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, left1, top_pos, Inches(0.08), card_h2)
    strip1.fill.solid()
    strip1.fill.fore_color.rgb = COLOR_TEAL_PRIMARY
    strip1.line.fill.background()

    tb_phil = slide2.shapes.add_textbox(left1 + Inches(0.25), top_pos + Inches(0.2), col_w - Inches(0.4), card_h2 - Inches(0.4))
    tf_phil = tb_phil.text_frame
    tf_phil.word_wrap = True

    p = tf_phil.paragraphs[0]
    p.text = "The Provenance Trust Paradigm"
    p.font.name = FONT_HEADING
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEAL_PRIMARY

    items_phil = [
        ("Signals, Not Arbitrary Verdicts", "Rather than issuing a subjective 'pass/fail' AI probability, Provenance executes 6 deterministic forensic checks, presenting recruiters with hard, verifiable facts (e.g. metadata editing timestamps, pHash layout comparison)."),
        ("Immutable Per-Issuer Ledgers", "Confirmed diplomas and certificates are committed to an append-only SHA-256 hash chain with PostgreSQL transaction-level concurrency locking. Records cannot be silently altered or deleted."),
        ("Clear Separation of Trust States", "Self-uploaded documents are explicitly marked as self-submitted evidence. Only institutional attestations committed to the hash chain attain verified status.")
    ]

    for title_txt, body_txt in items_phil:
        p_t = tf_phil.add_paragraph()
        p_t.text = f"• {title_txt}"
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(12)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_CHARCOAL
        p_t.space_before = Pt(12)

        p_b = tf_phil.add_paragraph()
        p_b.text = body_txt
        p_b.font.name = FONT_BODY
        p_b.font.size = Pt(10)
        p_b.font.color.rgb = COLOR_MUTED_TEXT
        p_b.space_before = Pt(3)

    # Right Column: 3 Impact Metrics & Key Benefits
    add_card(slide2, left2, top_pos, col_w, card_h2, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
    strip2 = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, left2, top_pos, Inches(0.08), card_h2)
    strip2.fill.solid()
    strip2.fill.fore_color.rgb = COLOR_EMERALD
    strip2.line.fill.background()

    tb_stats = slide2.shapes.add_textbox(left2 + Inches(0.25), top_pos + Inches(0.2), col_w - Inches(0.4), card_h2 - Inches(0.4))
    tf_stats = tb_stats.text_frame
    tf_stats.word_wrap = True

    p = tf_stats.paragraphs[0]
    p.text = "Key System Impact & Value Drivers"
    p.font.name = FONT_HEADING
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD

    metrics = [
        ("100% Tamper-Evident", "Cryptographic prevHash chaining makes retroactive record manipulation mathematically impossible without breaking the downstream chain."),
        ("< 500ms Instant Verification", "Sub-second public verification via credential ID lookup or QR code scanning replaces 2-4 week registrar turnaround times."),
        ("Zero-Knowledge Anti-SSRF", "Outbound institution registry queries use hardcoded hosts, strict token regex, and SHA-256 hashed recipient identities to guarantee security and privacy.")
    ]

    for title_txt, body_txt in metrics:
        p_t = tf_stats.add_paragraph()
        p_t.text = f"✔  {title_txt}"
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(12)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_CHARCOAL
        p_t.space_before = Pt(12)

        p_b = tf_stats.add_paragraph()
        p_b.text = body_txt
        p_b.font.name = FONT_BODY
        p_b.font.size = Pt(10)
        p_b.font.color.rgb = COLOR_MUTED_TEXT
        p_b.space_before = Pt(3)

    set_speaker_notes(slide2, """Slide 2 establishes the core mission of Provenance.
In today's hiring and academic landscapes, background checks are slow, manual, and unreliable.
Provenance introduces three revolutionary tenets:
First, 'Signals, Not Verdicts'—we provide clear, factual document inspection data rather than opaque probabilistic verdicts.
Second, immutable per-issuer ledgers—universities maintain an append-only SHA-256 chain where every issuance, verification, or revocation is cryptographically linked.
Third, clear separation of trust states—recruiters can instantly distinguish self-submitted resumes from institutionally certified diplomas.""")

    # =========================================================================
    # SLIDE 3: THE PROBLEM SPACE (Credential Fraud & Traditional Bottlenecks)
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_light_header(slide3, "Industry Landscape & Vulnerabilities", "The Growing Crisis in Credential Fraud & Legacy Verification", "Modern editing tools and vulnerable automated scrapers have broken the legacy trust model.")

    pain_points = [
        ("Sophisticated PDF Forgery", "Consumer software (Canva, Photoshop, Acrobat Pro) allows malicious actors to alter recipient names, GPA, and graduation dates with pixel-level precision, leaving visual inspectors completely oblivious.", COLOR_CRIMSON, COLOR_CRIMSON_BG),
        ("2 to 4 Week Verification Lag", "Recruiters and hiring managers spend weeks waiting for registrar responses via phone calls, emails, and physical mail, resulting in lost candidates and inflated operational overhead.", COLOR_AMBER, COLOR_AMBER_BG),
        ("Black-Box AI False Positives", "Heuristic-based AI verification systems produce opaque 'fraud risk scores' without audit trails, leading to wrongful disqualifications and legal liability for enterprises.", COLOR_TEAL_PRIMARY, COLOR_TEAL_LIGHT),
        ("Severe SSRF & Scraper Vulnerabilities", "Naive automated verification tools blindly follow URLs extracted from uploaded QR codes, opening corporate networks to Server-Side Request Forgery, DNS rebinding, and IP exfiltration.", COLOR_CRIMSON, COLOR_CRIMSON_BG)
    ]

    card3_w = Inches(5.6)
    card3_h = Inches(2.25)
    
    positions = [
        (Inches(0.8), Inches(1.85)),
        (Inches(6.9), Inches(1.85)),
        (Inches(0.8), Inches(4.35)),
        (Inches(6.9), Inches(4.35))
    ]

    for (p_title, p_desc, accent_col, bg_col), (l_pos, t_pos) in zip(pain_points, positions):
        c = add_card(slide3, l_pos, t_pos, card3_w, card3_h, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
        
        # Left accent pill
        strip = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l_pos + Inches(0.18), t_pos + Inches(0.2), Inches(0.08), card3_h - Inches(0.4))
        strip.fill.solid()
        strip.fill.fore_color.rgb = accent_col
        strip.line.fill.background()

        tb = slide3.shapes.add_textbox(l_pos + Inches(0.38), t_pos + Inches(0.15), card3_w - Inches(0.55), card3_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = p_title
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_CHARCOAL

        p2 = tf.add_paragraph()
        p2.text = p_desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_MUTED_TEXT
        p2.space_before = Pt(6)

    set_speaker_notes(slide3, """Slide 3 outlines why existing verification approaches fail.
1. PDF forgery has become accessible to everyone. Editing tools allow undetectable text replacement.
2. Legacy manual verification is painfully slow, taking up to 4 weeks.
3. Black-box AI systems are dangerous because they make opaque accusations without transparent proof.
4. Naive verification tools that scan QR codes from uploaded PDFs are susceptible to SSRF attacks if they fetch arbitrary URLs. Provenance solves every single one of these problems.""")

    # =========================================================================
    # SLIDE 4: FULL-STACK ARCHITECTURE & MONOREPO BLUEPRINT
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_light_header(slide4, "System Architecture & Engineering", "End-to-End Modern Monorepo Architecture", "Clean separation of concerns built on TypeScript, Next.js 14, Express, PostgreSQL, and native forensic engines.")

    # 4 Architecture Tier Columns
    tiers = [
        ("1. Presentation Tier", "Next.js 14 App Router", [
            "Tailwind CSS Responsive Design",
            "Lucide React Icons & Dynamic UI",
            "Role-Based Navigation (Candidate, Issuer, Admin)",
            "Public Verifier & Candidate Portfolio Showcase",
            "Client-side State & Auth Context"
        ], COLOR_TEAL_PRIMARY),
        ("2. API & Services Tier", "Express + TypeScript REST API", [
            "Multer Multi-Part Storage Pipeline",
            "JWT Authentication & RBAC Middleware",
            "Deterministic JSON Canonicalizer",
            "PostgreSQL Advisory Lock Orchestration",
            "Safe Logger & Sanitized API Responses"
        ], COLOR_BLUE),
        ("3. Forensics & Native Engines", "System-Level Analysis", [
            "Poppler (pdftoppm) Page Rasterization",
            "Tesseract OCR Spatial Extraction",
            "Sharp Perceptual Hash (pHash) 64-bit",
            "C2PA Content Authenticity Parser",
            "Anti-SSRF Constant-Host Connectors"
        ], COLOR_AMBER),
        ("4. Storage & Ledger Tier", "PostgreSQL 16 + Prisma", [
            "Prisma ORM Strongly Typed Client",
            "Append-Only CredentialEvent Chain",
            "pg_advisory_xact_lock Concurrency",
            "Indexed Lookup & Deduplication Hashes",
            "Comprehensive System AuditLog Table"
        ], COLOR_EMERALD)
    ]

    tier_w = Inches(2.72)
    tier_gap = Inches(0.25)
    tier_top = Inches(1.85)
    tier_h = Inches(4.9)

    for i, (t_title, t_tech, t_items, t_col) in enumerate(tiers):
        l_pos = Inches(0.8) + i * (tier_w + tier_gap)
        c = add_card(slide4, l_pos, tier_top, tier_w, tier_h, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
        
        # Header strip
        h_strip = slide4.shapes.add_shape(MSO_SHAPE.RECTANGLE, l_pos, tier_top, tier_w, Inches(0.08))
        h_strip.fill.solid()
        h_strip.fill.fore_color.rgb = t_col
        h_strip.line.fill.background()

        tb = slide4.shapes.add_textbox(l_pos + Inches(0.18), tier_top + Inches(0.18), tier_w - Inches(0.36), tier_h - Inches(0.36))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = t_title
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = t_col

        p2 = tf.add_paragraph()
        p2.text = t_tech
        p2.font.name = FONT_HEADING
        p2.font.size = Pt(10)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_CHARCOAL
        p2.space_before = Pt(4)

        div = tf.add_paragraph()
        div.text = "─────────────────"
        div.font.size = Pt(8)
        div.font.color.rgb = COLOR_BORDER
        div.space_before = Pt(4)

        for item in t_items:
            pi = tf.add_paragraph()
            pi.text = f"• {item}"
            pi.font.name = FONT_BODY
            pi.font.size = Pt(9.5)
            pi.font.color.rgb = COLOR_MUTED_TEXT
            pi.space_before = Pt(6)

    set_speaker_notes(slide4, """Slide 4 showcases the full-stack architecture of Provenance.
The repository is structured as an npm monorepo with clean workspaces:
- apps/web: Next.js App Router with Tailwind CSS, providing high-performance server and client rendering.
- apps/api: Express TypeScript API hosting authentication, file storage, and pipeline orchestration.
- packages/db: Shared Prisma schema and client managing PostgreSQL 16.
- Native Forensics: System-level binaries including Poppler for rasterization and Tesseract OCR for text extraction.""")

    # =========================================================================
    # SLIDE 5: 6-STAGE DETERMINISTIC DOCUMENT FORENSICS PIPELINE
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_light_header(slide5, "Forensic Inspection Engine", "The 6-Stage Deterministic Document Analysis Pipeline", "Every uploaded certificate undergoes deep automated inspection to extract objective structural evidence.")

    stages = [
        ("01", "Raw & Canonical Hashing", "Computes SHA-256 raw file hash for instant deduplication. Generates canonical hash of normalized title, issuer, recipient, and issue date.", COLOR_TEAL_PRIMARY),
        ("02", "PDF Metadata & Time Delta", "Parses low-level PDF /Producer, /Creator, /CreationDate, /ModDate. Flags anomalies where creation date postdates modification date.", COLOR_BLUE),
        ("03", "Editing Tool Signatures", "Inspects metadata dictionaries for signatures of known editing software: Photoshop, Canva, Illustrator, GIMP, Acrobat Pro.", COLOR_AMBER),
        ("04", "OCR Text & Recipient Match", "Runs Tesseract OCR with character-folding ('0'/'O', '1'/'I'). Evaluates Levenshtein distance against claimed candidate name and title.", COLOR_EMERALD),
        ("05", "Perceptual Hash (pHash)", "Computes 64-bit DCT perceptual hash on rasterized pages. Compares Hamming distance against known issuer certificate templates.", COLOR_TEAL_PRIMARY),
        ("06", "C2PA Authenticity Manifest", "Scans binary for Coalition for Content Provenance and Authenticity (C2PA) metadata, extracting hardware/cryptographic signing trails.", COLOR_BLUE)
    ]

    card5_w = Inches(3.7)
    card5_h = Inches(2.25)

    pos5 = [
        (Inches(0.8), Inches(1.85)),
        (Inches(4.8), Inches(1.85)),
        (Inches(8.8), Inches(1.85)),
        (Inches(0.8), Inches(4.35)),
        (Inches(4.8), Inches(4.35)),
        (Inches(8.8), Inches(4.35))
    ]

    for (num, s_title, s_desc, s_col), (l_pos, t_pos) in zip(stages, pos5):
        c = add_card(slide5, l_pos, t_pos, card5_w, card5_h, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
        
        # Number Badge
        num_badge = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l_pos + Inches(0.18), t_pos + Inches(0.18), Inches(0.45), Inches(0.35))
        num_badge.fill.solid()
        num_badge.fill.fore_color.rgb = COLOR_TEAL_LIGHT
        num_badge.line.color.rgb = s_col
        num_badge.line.width = Pt(1)
        tf_n = num_badge.text_frame
        pn = tf_n.paragraphs[0]
        pn.text = num
        pn.font.name = FONT_HEADING
        pn.font.size = Pt(11)
        pn.font.bold = True
        pn.font.color.rgb = s_col
        pn.alignment = PP_ALIGN.CENTER

        tb = slide5.shapes.add_textbox(l_pos + Inches(0.72), t_pos + Inches(0.12), card5_w - Inches(0.85), card5_h - Inches(0.25))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = s_title
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_CHARCOAL

        p2 = tf.add_paragraph()
        p2.text = s_desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = COLOR_MUTED_TEXT
        p2.space_before = Pt(6)

    set_speaker_notes(slide5, """Slide 5 details our 6-stage deterministic document analysis pipeline.
When a student or professional uploads a credential:
1. We compute both raw and canonical SHA-256 hashes.
2. We inspect PDF internal dictionaries for metadata gaps and timestamp anomalies.
3. We detect digital editing tool signatures like Photoshop or Canva.
4. Tesseract OCR extracts text and performs fuzzy Levenshtein matching against the user's name.
5. Perceptual hashing (pHash) fingerprints the visual certificate layout.
6. C2PA manifest analysis checks for hardware and cryptographic provenance signatures.
All results are stored in the DocumentAnalysis database table.""")

    # =========================================================================
    # SLIDE 6: CANDIDATE EXPERIENCE & FORENSICS IN ACTION (With Real Screenshot)
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_light_header(slide6, "Candidate Experience & Forensics in Action", "Live Document Ingestion & Transparent Signal Breakdown", "Candidates receive immediate factual feedback upon uploading credentials, with one-click attestation requests.")

    # Left Column: Real Screenshot Frame
    img_left = Inches(0.8)
    img_top = Inches(1.85)
    img_w = Inches(5.8)
    img_h = Inches(4.9)

    add_card(slide6, img_left, img_top, img_w, img_h, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
    
    cand_img_path = os.path.join(WORKSPACE_ROOT, "docs", "screenshots", "candidate_upload_success.png")
    if os.path.exists(cand_img_path):
        slide6.shapes.add_picture(cand_img_path, img_left + Inches(0.12), img_top + Inches(0.12), img_w - Inches(0.24), img_h - Inches(0.24))

    # Right Column: Feature Breakdown & Key UI Elements
    right_left = Inches(6.9)
    right_w = Inches(5.6)

    add_card(slide6, right_left, img_top, right_w, img_h, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
    strip_c6 = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, right_left, img_top, Inches(0.08), img_h)
    strip_c6.fill.solid()
    strip_c6.fill.fore_color.rgb = COLOR_TEAL_PRIMARY
    strip_c6.line.fill.background()

    tb6 = slide6.shapes.add_textbox(right_left + Inches(0.25), img_top + Inches(0.2), right_w - Inches(0.4), img_h - Inches(0.4))
    tf6 = tb6.text_frame
    tf6.word_wrap = True

    p = tf6.paragraphs[0]
    p.text = "Key UI & Workflow Highlights"
    p.font.name = FONT_HEADING
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEAL_PRIMARY

    cand_features = [
        ("Instant Forensic Diagnostic", "Displays overall status ('Low Concern' vs 'Review Recommended') along with OCR Confidence (e.g. 92.4%) and character count."),
        ("Transparent Signal Cards", "Each inspection metric shows the raw fact (e.g. 'Created by LaTeX, Producer: pdfTeX-1.40.24') and an explicit explanation."),
        ("One-Click University Attestation", "Candidates can link their upload directly to registered issuing universities (e.g. Stanford, MIT) to trigger formal institutional review."),
        ("Public Profile Integration", "Uploaded credentials appear immediately on the candidate's public profile (`/u/[username]`), accurately marked as self-submitted.")
    ]

    for f_title, f_desc in cand_features:
        p_t = tf6.add_paragraph()
        p_t.text = f"✦  {f_title}"
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(12)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_CHARCOAL
        p_t.space_before = Pt(10)

        p_d = tf6.add_paragraph()
        p_d.text = f_desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = COLOR_MUTED_TEXT
        p_d.space_before = Pt(3)

    set_speaker_notes(slide6, """Slide 6 demonstrates the live candidate upload interface, captured directly from the running web application.
As seen on the left:
- The candidate uploads a diploma PDF.
- The system immediately rasterizes and analyzes the document, computing an OCR confidence score (e.g. 92.4%).
- Forensic signals are surfaced with clear badges (Low Concern in green, Review Recommended in amber).
- The candidate can then click 'Request Attestation' to send the document to the university's verification queue.""")

    # =========================================================================
    # SLIDE 7: CRYPTOGRAPHIC PER-ISSUER HASH CHAIN
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_light_header(slide7, "Cryptographic Integrity Engine", "The Per-Issuer Tamper-Evident Hash Chain", "An append-only cryptographic ledger providing mathematical proof of record immutability.")

    # Left Column: How the Hash Chain Works
    left_w = Inches(5.6)
    c_left = Inches(0.8)
    c_right = Inches(6.9)
    top7 = Inches(1.85)
    h7 = Inches(4.9)

    add_card(slide7, c_left, top7, left_w, h7, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
    strip7 = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, c_left, top7, Inches(0.08), h7)
    strip7.fill.solid()
    strip7.fill.fore_color.rgb = COLOR_EMERALD
    strip7.line.fill.background()

    tb7 = slide7.shapes.add_textbox(c_left + Inches(0.25), top7 + Inches(0.2), left_w - Inches(0.4), h7 - Inches(0.4))
    tf7 = tb7.text_frame
    tf7.word_wrap = True

    p = tf7.paragraphs[0]
    p.text = "Append-Only Cryptographic Mechanics"
    p.font.name = FONT_HEADING
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD

    mech_items = [
        ("Deterministic Canonicalization", "All event payloads are recursively key-sorted and serialized into stable JSON strings before hashing, eliminating JSON key-ordering discrepancies."),
        ("Cryptographic Event Linkage", "Every block contains SHA-256(canonicalData) as contentHash and references the previous block's contentHash as prevHash."),
        ("PostgreSQL Advisory Concurrency Lock", "`SELECT pg_advisory_xact_lock(hashtext(issuerId))` serializes concurrent writes per institution, preventing race conditions or chain forks."),
        ("Mathematical Auditability", "Any verifier can re-execute `verifyChain(issuerId)`. If a malicious actor alters any row in PostgreSQL, the contentHash and downstream prevHash links fail instantly.")
    ]

    for m_title, m_desc in mech_items:
        p_t = tf7.add_paragraph()
        p_t.text = f"✔  {m_title}"
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(12)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_CHARCOAL
        p_t.space_before = Pt(10)

        p_d = tf7.add_paragraph()
        p_d.text = m_desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = COLOR_MUTED_TEXT
        p_d.space_before = Pt(3)

    # Right Column: Visual Chain Diagram / Code Architecture Box
    add_card(slide7, c_right, top7, left_w, h7, bg_color=COLOR_DARK_SURFACE, border_color=RGBColor(51, 65, 85))

    tb_diag = slide7.shapes.add_textbox(c_right + Inches(0.25), top7 + Inches(0.2), left_w - Inches(0.4), h7 - Inches(0.4))
    tf_d = tb_diag.text_frame
    tf_d.word_wrap = True

    pd = tf_d.paragraphs[0]
    pd.text = "Cryptographic Chain Data Structure"
    pd.font.name = FONT_HEADING
    pd.font.size = Pt(15)
    pd.font.bold = True
    pd.font.color.rgb = RGBColor(110, 231, 183)

    blocks = [
        ("Genesis Event (issued)", "prevHash: null", "contentHash: 8a4f...e3b1", "Status: Valid Genesis"),
        ("Verification Event (verified)", "prevHash: 8a4f...e3b1", "contentHash: d92c...7f04", "Status: Linked & Verified"),
        ("Attestation Event (verified)", "prevHash: d92c...7f04", "contentHash: 3c1a...9b82", "Status: Chain Tip Locked")
    ]

    for b_name, p_hash, c_hash, stat in blocks:
        pb_n = tf_d.add_paragraph()
        pb_n.text = f"┌─── {b_name} ───"
        pb_n.font.name = "Courier New"
        pb_n.font.size = Pt(10.5)
        pb_n.font.bold = True
        pb_n.font.color.rgb = COLOR_WHITE
        pb_n.space_before = Pt(8)

        pb_p = tf_d.add_paragraph()
        pb_p.text = f"│  {p_hash}\n│  {c_hash}\n└── Result: {stat}"
        pb_p.font.name = "Courier New"
        pb_p.font.size = Pt(9.5)
        pb_p.font.color.rgb = RGBColor(148, 163, 184)
        pb_p.space_before = Pt(2)

    set_speaker_notes(slide7, """Slide 7 explains the mathematical core of Provenance: the per-issuer tamper-evident hash chain.
In apps/api/src/services/hash-chain.ts:
- Each event (issued, verified, rejected, revoked) is canonically serialized with deterministicSerialize().
- We acquire a PostgreSQL advisory lock on hashtext(issuerId) so that simultaneous operations cannot create race conditions.
- The new block links to the previous tip via prevHash.
- Anyone can audit the entire chain at runtime with verifyChain(). If any byte in PostgreSQL is maliciously altered, verifyChain() pinpoints the exact broken block and marks subsequent blocks as 'depends_on_invalid'.""")

    # =========================================================================
    # SLIDE 8: INSTITUTIONAL ISSUER PORTAL (With Real Screenshot)
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    add_light_header(slide8, "Institutional Issuer Portal", "University Review Queue & Batch Issuance", "Institutions review candidate requests, inspect forensic signals, and commit attestations to the ledger.")

    # Left Column: Real Screenshot Frame
    img_top8 = Inches(1.85)
    img_h8 = Inches(4.9)
    img_w8 = Inches(5.8)

    add_card(slide8, img_left, img_top8, img_w8, img_h8, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
    
    issuer_img_path = os.path.join(WORKSPACE_ROOT, "docs", "screenshots", "issuer_review_approved.png")
    if os.path.exists(issuer_img_path):
        slide8.shapes.add_picture(issuer_img_path, img_left + Inches(0.12), img_top8 + Inches(0.12), img_w8 - Inches(0.24), img_h8 - Inches(0.24))

    # Right Column: Institutional Features
    add_card(slide8, right_left, img_top8, right_w, img_h8, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
    strip8 = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, right_left, img_top8, Inches(0.08), img_h8)
    strip8.fill.solid()
    strip8.fill.fore_color.rgb = COLOR_TEAL_PRIMARY
    strip8.line.fill.background()

    tb8 = slide8.shapes.add_textbox(right_left + Inches(0.25), img_top8 + Inches(0.2), right_w - Inches(0.4), img_h8 - Inches(0.4))
    tf8 = tb8.text_frame
    tf8.word_wrap = True

    p = tf8.paragraphs[0]
    p.text = "Issuer Capabilities & Audit Trails"
    p.font.name = FONT_HEADING
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEAL_PRIMARY

    issuer_features = [
        ("Review Queue Workflow", "Centralized queue displaying incoming student attestation requests with extracted metadata, claimed credentials, and timestamps."),
        ("Side-by-Side Forensic Review", "Inspect PDF document preview, OCR text extracted by Tesseract, and metadata analysis signals side-by-side with student records."),
        ("One-Click Chain Commitment", "Approving a request atomically creates a `verified` CredentialEvent on the issuer's hash chain, immediately upgrading the credential status."),
        ("Institutional Roster & Revocation", "Searchable roster of all active credentials with instant revocation capabilities if academic misconduct or administrative error occurs.")
    ]

    for f_title, f_desc in issuer_features:
        p_t = tf8.add_paragraph()
        p_t.text = f"✔  {f_title}"
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(12)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_CHARCOAL
        p_t.space_before = Pt(10)

        p_d = tf8.add_paragraph()
        p_d.text = f_desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = COLOR_MUTED_TEXT
        p_d.space_before = Pt(3)

    set_speaker_notes(slide8, """Slide 8 showcases the Institutional Review Portal, captured directly from our running issuer staff portal.
University registrars and department staff can:
- View incoming attestation requests from candidates.
- Review forensic signals and verify extracted student names against their internal SIS records.
- Approve with one click, which invokes appendChainEvent() in PostgreSQL to cryptographically mint the attestation.
- Manage active diplomas and execute instant revocations if necessary.""")

    # =========================================================================
    # SLIDE 9: PUBLIC VERIFIER & CANDIDATE PORTFOLIO
    # =========================================================================
    slide9 = prs.slides.add_slide(blank_layout)
    add_light_header(slide9, "Public Verification & Trust Showcase", "Zero-Friction Recruiter Audit & Public Portfolios", "Instant QR and Credential ID lookup backed by privacy-preserving trust badges.")

    # 3 Column Cards
    col3_w = Inches(3.7)
    col3_h = Inches(4.9)
    col3_top = Inches(1.85)

    v_cards = [
        ("1. Instant Public Verifier", "Accessible via `/verify/[credentialId]`", [
            "QR Code Direct Scanning: Hiring managers scan physical/digital QR codes to open verification instantly.",
            "No Login Required: Public recruiters can verify legitimacy without creating an account or paying fees.",
            "Trust Status Badges: Verified (Green), Self-Submitted (Amber), Revoked (Red).",
            "Proof Integrity Stamp: Displays cryptographic contentHash and issuing university verification date."
        ], COLOR_TEAL_PRIMARY),
        ("2. Candidate Public Portfolio", "Accessible via `/u/[publicUsername]`", [
            "Shareable Web Profile: Clean, professional link for LinkedIn, resumes, and portfolios.",
            "Visual Distinction: Verified institutional diplomas are clearly differentiated from self-submitted uploads.",
            "Direct Verification Links: Each credential card links directly to its underlying cryptographic audit proof.",
            "Privacy Shield: Sensitive emails, raw file paths, and declined items are strictly omitted."
        ], COLOR_EMERALD),
        ("3. Privacy-Preserving Guardrails", "Zero Data Leakage Architecture", [
            "PII Isolation: Candidate contact info and internal storage keys are never exposed on public routes.",
            "Safe Error Handling: Missing credentials return generic 404 without revealing private system existence.",
            "Hashed Public Connectors: Issuer registry lookups store only SHA-256 name hashes (`rawNameHash`).",
            "Revocation Honesty: Revoked credentials display explicit timestamp and reason without data deletion."
        ], COLOR_BLUE)
    ]

    for i, (v_title, v_sub, v_items, v_col) in enumerate(v_cards):
        l_pos = Inches(0.8) + i * (col3_w + Inches(0.31))
        c = add_card(slide9, l_pos, col3_top, col3_w, col3_h, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
        
        # Header strip
        h_strip = slide9.shapes.add_shape(MSO_SHAPE.RECTANGLE, l_pos, col3_top, col3_w, Inches(0.08))
        h_strip.fill.solid()
        h_strip.fill.fore_color.rgb = v_col
        h_strip.line.fill.background()

        tb = slide9.shapes.add_textbox(l_pos + Inches(0.18), col3_top + Inches(0.18), col3_w - Inches(0.36), col3_h - Inches(0.36))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = v_title
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = v_col

        p2 = tf.add_paragraph()
        p2.text = v_sub
        p2.font.name = FONT_BODY
        p2.font.size = Pt(9.5)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_CHARCOAL
        p2.space_before = Pt(4)

        div = tf.add_paragraph()
        div.text = "──────────────────────────"
        div.font.size = Pt(8)
        div.font.color.rgb = COLOR_BORDER
        div.space_before = Pt(4)

        for item in v_items:
            pi = tf.add_paragraph()
            parts = item.split(": ")
            if len(parts) == 2:
                pi.text = f"• {parts[0]}: "
                pi.font.name = FONT_HEADING
                pi.font.size = Pt(9.5)
                pi.font.bold = True
                pi.font.color.rgb = COLOR_CHARCOAL
                
                # Append description
                run = pi.add_run()
                run.text = parts[1]
                run.font.name = FONT_BODY
                run.font.size = Pt(9.5)
                run.font.bold = False
                run.font.color.rgb = COLOR_MUTED_TEXT
            else:
                pi.text = f"• {item}"
                pi.font.name = FONT_BODY
                pi.font.size = Pt(9.5)
                pi.font.color.rgb = COLOR_MUTED_TEXT
            pi.space_before = Pt(6)

    set_speaker_notes(slide9, """Slide 9 covers the public verification and candidate portfolio experience.
- The verifier page (/verify/[id]) allows any hiring manager or recruiter to audit a credential in under a second.
- The candidate public profile (/u/[username]) provides a beautiful, verifiable portfolio showcasing confirmed credentials.
- Security and privacy are strictly preserved: no PII, internal IDs, or private document storage keys are exposed on public endpoints.""")

    # =========================================================================
    # SLIDE 10: ARCHITECTURAL SAFETY: ANTI-SSRF PUBLIC ISSUER CONNECTORS
    # =========================================================================
    slide10 = prs.slides.add_slide(blank_layout)
    add_light_header(slide10, "Zero-Trust Security Discipline", "Architectural Safety: Anti-SSRF Public Issuer Connectors", "Rigorous defense-in-depth controls preventing Server-Side Request Forgery and data exfiltration.")

    # Left Column: The Vulnerability vs Provenance Rules
    left10_w = Inches(5.6)
    add_card(slide10, Inches(0.8), Inches(1.85), left10_w, Inches(4.9), bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
    strip10_l = slide10.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.85), Inches(0.08), Inches(4.9))
    strip10_l.fill.solid()
    strip10_l.fill.fore_color.rgb = COLOR_CRIMSON
    strip10_l.line.fill.background()

    tb10_l = slide10.shapes.add_textbox(Inches(1.05), Inches(2.05), left10_w - Inches(0.4), Inches(4.5))
    tf10_l = tb10_l.text_frame
    tf10_l.word_wrap = True

    p = tf10_l.paragraphs[0]
    p.text = "Strictly Prohibited Practices (SSRF Vectors)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = COLOR_CRIMSON

    prohibs = [
        ("No Arbitrary URL Fetching", "Provenance never extracts a URL or QR code payload from uploaded documents to fetch it. Allowing document contents to dictate host, port, or path is textbook SSRF."),
        ("No Open Network Scrapers", "OCR text is never used to determine outbound network destinations or dynamic HTTP endpoints."),
        ("No Plaintext Third-Party Storage", "Extracted recipient names from public issuer verification pages are never stored in plaintext in any table or API response. Only a SHA-256 hash is persisted.")
    ]

    for p_head, p_body in prohibs:
        pt = tf10_l.add_paragraph()
        pt.text = f"✖  {p_head}"
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(11.5)
        pt.font.bold = True
        pt.font.color.rgb = COLOR_CHARCOAL
        pt.space_before = Pt(10)

        pb = tf10_l.add_paragraph()
        pb.text = p_body
        pb.font.name = FONT_BODY
        pb.font.size = Pt(9.5)
        pb.font.color.rgb = COLOR_MUTED_TEXT
        pb.space_before = Pt(3)

    # Right Column: 6 Concrete Defense-in-Depth Controls
    add_card(slide10, Inches(6.9), Inches(1.85), left10_w, Inches(4.9), bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
    strip10_r = slide10.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.9), Inches(1.85), Inches(0.08), Inches(4.9))
    strip10_r.fill.solid()
    strip10_r.fill.fore_color.rgb = COLOR_EMERALD
    strip10_r.line.fill.background()

    tb10_r = slide10.shapes.add_textbox(Inches(7.15), Inches(2.05), left10_w - Inches(0.4), Inches(4.5))
    tf10_r = tb10_r.text_frame
    tf10_r.word_wrap = True

    p = tf10_r.paragraphs[0]
    p.text = "Concrete Anti-SSRF Defense Controls"
    p.font.name = FONT_HEADING
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD

    controls = [
        ("Decoupled Host Registry", "Connector selection is steered exclusively by candidate's self-declared institution name matched against a static alias registry."),
        ("Constant Destination Hosts", "Destination host ('www.coursera.org') is a hardcoded module constant. Target URL host and 'https:' protocol are asserted before dispatch."),
        ("Strict Whitelist Regex", "Tokens are validated against /^[A-Z0-9]{8,20}$/. Slashes, dots, and queries are rejected with zero network requests."),
        ("Same-Host Redirect Policy", "Redirects (max 2 hops) strictly assert targetUrl.host === connector.host and HTTPS at every hop. Any discrepancy immediately aborts."),
        ("Resource Bounds & 24h Cache", "5-second AbortController timeout, 512KB response body cap, and 24-hour IssuerLookup database caching prevent resource exhaustion.")
    ]

    for c_head, c_body in controls:
        pt = tf10_r.add_paragraph()
        pt.text = f"✔  {c_head}"
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(11)
        pt.font.bold = True
        pt.font.color.rgb = COLOR_CHARCOAL
        pt.space_before = Pt(8)

        pb = tf10_r.add_paragraph()
        pb.text = c_body
        pb.font.name = FONT_BODY
        pb.font.size = Pt(9)
        pb.font.color.rgb = COLOR_MUTED_TEXT
        pb.space_before = Pt(2)

    set_speaker_notes(slide10, """Slide 10 details our strict Anti-SSRF architectural policy.
When integrating external public verification registries (such as Coursera):
- Many naive systems crawl URLs found inside PDFs, creating massive SSRF vulnerabilities.
- Provenance strictly prohibits arbitrary URL fetching.
- We use constant hostnames, strict alphanumeric token whitelists, same-host redirect verification, 5-second timeouts, and 512KB payload limits.
- Furthermore, if external HTML parsing fails, our discipline produces 'issuer_lookup_unavailable' (inconclusive), never a false accusation of forgery.""")

    # =========================================================================
    # SLIDE 11: MULTI-ROLE ECOSYSTEM & RBAC
    # =========================================================================
    slide11 = prs.slides.add_slide(blank_layout)
    add_light_header(slide11, "Role-Based Access Control & User Journeys", "Multi-Role Ecosystem: Seamless Personas & Workflows", "Tailored experiences for Candidates, Issuer Staff, Recruiters, and Platform Administrators.")

    roles = [
        ("Candidate", "Upload & Manage Portfolio", [
            "Upload certificates & view instant forensics",
            "Request attestation from universities",
            "Curate shareable public portfolio link",
            "Monitor verification request progress"
        ], COLOR_TEAL_PRIMARY),
        ("Issuer Staff", "Review & Cryptographic Issuance", [
            "Manage incoming student attestation queue",
            "Side-by-side OCR & forensic inspection",
            "Commit approved credentials to hash chain",
            "Search institutional roster & revoke records"
        ], COLOR_EMERALD),
        ("Recruiter / Verifier", "Audit & Verify Trust", [
            "Zero-friction ID search & QR scanning",
            "Audit tamper-evident SHA-256 proofs",
            "Inspect raw forensic inspection signals",
            "Confirm active vs revoked diploma status"
        ], COLOR_BLUE),
        ("Platform Admin", "Governance & Infrastructure", [
            "Approve & onboard issuing universities",
            "Verify institution domains and staff accounts",
            "Inspect system-wide actor Audit Logs",
            "Monitor server health & database backups"
        ], COLOR_AMBER)
    ]

    r_w = Inches(2.72)
    r_gap = Inches(0.25)
    r_top = Inches(1.85)
    r_h = Inches(4.9)

    for i, (r_name, r_sub, r_bullets, r_col) in enumerate(roles):
        l_pos = Inches(0.8) + i * (r_w + r_gap)
        c = add_card(slide11, l_pos, r_top, r_w, r_h, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
        
        # Header strip
        h_strip = slide11.shapes.add_shape(MSO_SHAPE.RECTANGLE, l_pos, r_top, r_w, Inches(0.08))
        h_strip.fill.solid()
        h_strip.fill.fore_color.rgb = r_col
        h_strip.line.fill.background()

        tb = slide11.shapes.add_textbox(l_pos + Inches(0.18), r_top + Inches(0.18), r_w - Inches(0.36), r_h - Inches(0.36))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = r_name
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = r_col

        p2 = tf.add_paragraph()
        p2.text = r_sub
        p2.font.name = FONT_HEADING
        p2.font.size = Pt(9.5)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_CHARCOAL
        p2.space_before = Pt(4)

        div = tf.add_paragraph()
        div.text = "─────────────────"
        div.font.size = Pt(8)
        div.font.color.rgb = COLOR_BORDER
        div.space_before = Pt(4)

        for bullet in r_bullets:
            pi = tf.add_paragraph()
            pi.text = f"• {bullet}"
            pi.font.name = FONT_BODY
            pi.font.size = Pt(9.5)
            pi.font.color.rgb = COLOR_MUTED_TEXT
            pi.space_before = Pt(8)

    set_speaker_notes(slide11, """Slide 11 highlights our comprehensive Role-Based Access Control architecture.
Provenance supports four primary actors:
1. Candidates who upload credentials and showcase verified public portfolios.
2. Issuer Staff (registrars, university admins) who review queues and commit records to their cryptographic ledger.
3. Recruiters and Verifiers who audit authenticity in sub-seconds via QR codes or credential IDs.
4. Platform Admins who oversee institutional vetting, domain verification, and system-wide audit logging.""")

    # =========================================================================
    # SLIDE 12: DATABASE SCHEMA & DATA MODEL
    # =========================================================================
    slide12 = prs.slides.add_slide(blank_layout)
    add_light_header(slide12, "Data Architecture & Prisma Schema", "Relational Data Model & Cryptographic Entities", "Prisma schema designed for transactional consistency, auditability, and tamper-detection.")

    # 3 Schema Area Columns
    schema_cols = [
        ("Identity & Institutions", "Core User & Issuer Models", [
            "User: id, email, passwordHash, role (candidate | issuer_staff | platform_admin).",
            "CandidateProfile: userId, publicUsername, name, headline, bio, avatarUrl.",
            "Issuer: id, name, domain (unique), status (pending | approved | rejected), approvedBy.",
            "IssuerUser: id, issuerId, userId, role (staff | admin)."
        ], COLOR_TEAL_PRIMARY),
        ("Forensics & Analysis", "Document & Inspection Models", [
            "Document: id, candidateId, storageKey, rawFileHash, canonicalContentHash, phash, ocrText, ocrConfidence, c2paPresent.",
            "DocumentAnalysis: id, documentId, signalType, signalValue (JSON), severity (low_concern | review_recommended | inconclusive).",
            "IssuerLookup: id, documentId, connectorId, code, outcome, rawNameHash, checkedAt."
        ], COLOR_AMBER),
        ("Credentials & Hash Ledger", "Immutable Ledger Models", [
            "Credential: id, candidateId, issuerId, source, status (unverified | pending | verified | rejected | revoked), credentialType, title.",
            "VerificationRequest: id, credentialId, candidateId, issuerId, status, requestedAt, resolvedAt, resolvedBy.",
            "CredentialEvent: id, credentialId, issuerId, eventType, canonicalData (JSON), contentHash, prevHash, createdAt, createdBy.",
            "AuditLog: id, actorId, action, targetType, targetId, metadata (JSON), createdAt."
        ], COLOR_EMERALD)
    ]

    for i, (s_name, s_sub, s_tables, s_col) in enumerate(schema_cols):
        l_pos = Inches(0.8) + i * (col3_w + Inches(0.31))
        c = add_card(slide12, l_pos, col3_top, col3_w, col3_h, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
        
        h_strip = slide12.shapes.add_shape(MSO_SHAPE.RECTANGLE, l_pos, col3_top, col3_w, Inches(0.08))
        h_strip.fill.solid()
        h_strip.fill.fore_color.rgb = s_col
        h_strip.line.fill.background()

        tb = slide12.shapes.add_textbox(l_pos + Inches(0.18), col3_top + Inches(0.18), col3_w - Inches(0.36), col3_h - Inches(0.36))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = s_name
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = s_col

        p2 = tf.add_paragraph()
        p2.text = s_sub
        p2.font.name = FONT_BODY
        p2.font.size = Pt(9.5)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_CHARCOAL
        p2.space_before = Pt(4)

        div = tf.add_paragraph()
        div.text = "──────────────────────────"
        div.font.size = Pt(8)
        div.font.color.rgb = COLOR_BORDER
        div.space_before = Pt(4)

        for table in s_tables:
            pi = tf.add_paragraph()
            parts = table.split(": ")
            if len(parts) == 2:
                pi.text = f"• {parts[0]}: "
                pi.font.name = FONT_HEADING
                pi.font.size = Pt(9.5)
                pi.font.bold = True
                pi.font.color.rgb = COLOR_CHARCOAL
                
                run = pi.add_run()
                run.text = parts[1]
                run.font.name = FONT_BODY
                run.font.size = Pt(9)
                run.font.bold = False
                run.font.color.rgb = COLOR_MUTED_TEXT
            else:
                pi.text = f"• {table}"
                pi.font.name = FONT_BODY
                pi.font.size = Pt(9)
                pi.font.color.rgb = COLOR_MUTED_TEXT
            pi.space_before = Pt(6)

    set_speaker_notes(slide12, """Slide 12 reviews our database schema defined in packages/db/prisma/schema.prisma.
- Identity tables link Users, Profiles, and Issuers with domain verification.
- Forensics tables persist raw hashes, OCR output, and individual DocumentAnalysis signals.
- Ledger tables contain the Credential records and the append-only CredentialEvent chain, which maintains the prevHash-contentHash sequence.
- All write actions are recorded in the AuditLog table for enterprise compliance.""")

    # =========================================================================
    # SLIDE 13: SECURITY, PRIVACY & COMPLIANCE
    # =========================================================================
    slide13 = prs.slides.add_slide(blank_layout)
    add_light_header(slide13, "Enterprise Security & Compliance", "Defense-in-Depth Security & Privacy Architecture", "Engineered from the ground up for strict confidentiality, data minimization, and auditability.")

    sec_cards = [
        ("Cryptographic Integrity", "SHA-256 content hashes, deterministic JSON canonicalization, and PostgreSQL transaction advisory locking prevent data corruption and tampering.", COLOR_TEAL_PRIMARY),
        ("Auth & Access Control", "Stateless JWT authentication, bcrypt (12 rounds) password hashing, and strict role-based route middleware protect all internal endpoints.", COLOR_BLUE),
        ("Zero PII Leakage", "Candidate emails, phone numbers, and physical storage paths are completely omitted from public API payloads and verifier views.", COLOR_EMERALD),
        ("Immutable Audit Logs", "Every platform action (login, upload, verification, approval, rejection, issuer creation) is immutably logged with actorId, timestamps, and metadata.", COLOR_AMBER)
    ]

    for (s_title, s_desc, s_col), (l_pos, t_pos) in zip(sec_cards, positions):
        c = add_card(slide13, l_pos, t_pos, card3_w, card3_h, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
        
        strip = slide13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l_pos + Inches(0.18), t_pos + Inches(0.2), Inches(0.08), card3_h - Inches(0.4))
        strip.fill.solid()
        strip.fill.fore_color.rgb = s_col
        strip.line.fill.background()

        tb = slide13.shapes.add_textbox(l_pos + Inches(0.38), t_pos + Inches(0.15), card3_w - Inches(0.55), card3_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = s_title
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_CHARCOAL

        p2 = tf.add_paragraph()
        p2.text = s_desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_MUTED_TEXT
        p2.space_before = Pt(6)

    set_speaker_notes(slide13, """Slide 13 details our defense-in-depth security and privacy model.
- Cryptographic integrity ensures that no record can be forged or tampered with.
- Authentication enforces industry-standard JWTs and bcrypt hashing.
- Candidate PII is protected under strict data minimization rules: public verifiers only receive verified trust signals and metadata hashes.
- Comprehensive audit logging provides an unbroken chain of accountability for enterprise compliance.""")

    # =========================================================================
    # SLIDE 14: PRODUCT ROADMAP & FUTURE EXPANSION
    # =========================================================================
    slide14 = prs.slides.add_slide(blank_layout)
    add_light_header(slide14, "Product Roadmap & Strategic Horizon", "Strategic Roadmap: The Future of Verifiable Credentials", "Expanding Provenance across decentralized identity, AI forgery detection, and global issuer networks.")

    phases = [
        ("Phase 1: W3C Decentralized Identity (DIDs)", "Integration with W3C Verifiable Credentials (VC) standard, allowing candidates to export cryptographically signed credentials directly to Apple Wallet & Google Wallet.", COLOR_TEAL_PRIMARY),
        ("Phase 2: Deep Learning GAN Forgery Detection", "Advanced computer vision models detecting subtle generative AI visual inpainting, font boundary irregularities, and digital certificate stamp manipulations.", COLOR_BLUE),
        ("Phase 3: Enterprise HRIS & ATS Integrations", "Direct API connectors and webhooks for Workday, Greenhouse, Lever, and SAP SuccessFactors for automated candidate verification upon job application.", COLOR_AMBER),
        ("Phase 4: Global Federated Issuer Consortium", "Decentralized consensus verification network connecting international universities, accreditation boards, and professional licensing bodies worldwide.", COLOR_EMERALD)
    ]

    for (p_title, p_desc, p_col), (l_pos, t_pos) in zip(phases, positions):
        c = add_card(slide14, l_pos, t_pos, card3_w, card3_h, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
        
        strip = slide14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l_pos + Inches(0.18), t_pos + Inches(0.2), Inches(0.08), card3_h - Inches(0.4))
        strip.fill.solid()
        strip.fill.fore_color.rgb = p_col
        strip.line.fill.background()

        tb = slide14.shapes.add_textbox(l_pos + Inches(0.38), t_pos + Inches(0.15), card3_w - Inches(0.55), card3_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = p_title
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_CHARCOAL

        p2 = tf.add_paragraph()
        p2.text = p_desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_MUTED_TEXT
        p2.space_before = Pt(6)

    set_speaker_notes(slide14, """Slide 14 outlines our future product vision:
1. Phase 1 brings W3C Decentralized Identifier (DID) and Verifiable Credential support, enabling mobile wallet exports.
2. Phase 2 introduces visual deep learning models to detect generative AI image inpainting.
3. Phase 3 creates seamless enterprise integrations with major ATS platforms like Workday and Greenhouse.
4. Phase 4 expands into a global consortium connecting universities and licensing bodies across international borders.""")

    # =========================================================================
    # SLIDE 15: SUMMARY & CONCLUSION (Dark Theme)
    # =========================================================================
    slide15 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide15, COLOR_DARK_BG)

    # Accent glow top bar
    glow15 = slide15.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.12))
    glow15.fill.solid()
    glow15.fill.fore_color.rgb = COLOR_TEAL_PRIMARY
    glow15.line.fill.background()

    # Category Pill
    pill15 = slide15.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(0.8), Inches(3.9), Inches(0.38))
    pill15.fill.solid()
    pill15.fill.fore_color.rgb = RGBColor(23, 42, 69)
    pill15.line.color.rgb = COLOR_TEAL_PRIMARY
    pill15.line.width = Pt(1.5)
    tf15 = pill15.text_frame
    p15 = tf15.paragraphs[0]
    p15.text = "✦  THE FUTURE OF CREDENTIAL TRUST"
    p15.font.name = FONT_HEADING
    p15.font.size = Pt(10)
    p15.font.bold = True
    p15.font.color.rgb = RGBColor(86, 204, 242)
    p15.alignment = PP_ALIGN.CENTER

    # Title
    t_box15 = slide15.shapes.add_textbox(Inches(1.2), Inches(1.3), Inches(10.9), Inches(1.1))
    tf_t15 = t_box15.text_frame
    tf_t15.word_wrap = True
    pt15 = tf_t15.paragraphs[0]
    pt15.text = "Proven Integrity. Zero Doubt. Instant Trust."
    pt15.font.name = FONT_HEADING
    pt15.font.size = Pt(32)
    pt15.font.bold = True
    pt15.font.color.rgb = COLOR_WHITE

    pt15_sub = tf_t15.add_paragraph()
    pt15_sub.text = "Provenance bridges candidates, issuing institutions, and verifiers into an unforgeable trust ecosystem."
    pt15_sub.font.name = FONT_BODY
    pt15_sub.font.size = Pt(14)
    pt15_sub.font.color.rgb = RGBColor(148, 163, 184)
    pt15_sub.space_before = Pt(4)

    # 3 Summary Pillar Cards
    sum_cards = [
        ("Deterministic Forensics", "6-stage file analysis providing objective evidence rather than opaque probabilistic guesses.", COLOR_TEAL_PRIMARY, RGBColor(86, 204, 242)),
        ("Tamper-Evident Ledger", "Append-only cryptographic hash chain guaranteeing mathematical record immutability.", COLOR_EMERALD, RGBColor(110, 231, 183)),
        ("Enterprise Architecture", "Next.js App Router, Express, PostgreSQL, Anti-SSRF connectors, and privacy-preserving APIs.", COLOR_BLUE, RGBColor(147, 197, 253))
    ]

    card15_w = Inches(3.45)
    card15_h = Inches(2.6)
    card15_top = Inches(2.65)

    for i, (st, sd, s_bar, s_txt_col) in enumerate(sum_cards):
        l_pos = Inches(1.2) + i * (card15_w + Inches(0.27))
        c = add_card(slide15, l_pos, card15_top, card15_w, card15_h, bg_color=COLOR_DARK_SURFACE, border_color=RGBColor(51, 65, 85))
        
        c_bar = slide15.shapes.add_shape(MSO_SHAPE.RECTANGLE, l_pos, card15_top, card15_w, Inches(0.06))
        c_bar.fill.solid()
        c_bar.fill.fore_color.rgb = s_bar
        c_bar.line.fill.background()

        tb = slide15.shapes.add_textbox(l_pos + Inches(0.2), card15_top + Inches(0.2), card15_w - Inches(0.4), card15_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = st
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = s_txt_col

        p2 = tf.add_paragraph()
        p2.text = sd
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = RGBColor(203, 213, 225)
        p2.space_before = Pt(10)

    # Bottom Quickstart & Contact Box
    qs_box = add_card(slide15, Inches(1.2), Inches(5.5), Inches(10.9), Inches(1.3), bg_color=COLOR_DARK_SURFACE, border_color=COLOR_TEAL_PRIMARY)
    tb_qs = slide15.shapes.add_textbox(Inches(1.4), Inches(5.6), Inches(10.5), Inches(1.1))
    tf_qs = tb_qs.text_frame
    tf_qs.word_wrap = True

    p_qs = tf_qs.paragraphs[0]
    p_qs.text = "⚡  Get Started with Provenance in 3 Steps:"
    p_qs.font.name = FONT_HEADING
    p_qs.font.size = Pt(12)
    p_qs.font.bold = True
    p_qs.font.color.rgb = RGBColor(86, 204, 242)

    p_qs_steps = tf_qs.add_paragraph()
    p_qs_steps.text = "1. Clone repo & run `npm install`   •   2. Start DB with `docker-compose up -d` & run migrations   •   3. Launch `npm run dev:api` & `npm run dev:web`"
    p_qs_steps.font.name = "Courier New"
    p_qs_steps.font.size = Pt(10)
    p_qs_steps.font.color.rgb = RGBColor(226, 232, 240)
    p_qs_steps.space_before = Pt(6)

    set_speaker_notes(slide15, """Slide 15 concludes our presentation.
Provenance is a fully realized, production-ready platform combining forensic intelligence, cryptographic certainty, and intuitive user experiences.
With our clean monorepo architecture, getting started takes only three simple steps.
Thank you for your time. We welcome your questions and invite you to explore the Provenance repository!""")

    # Save presentation
    output_path = os.path.join(WORKSPACE_ROOT, "docs", "presentation", "Provenance_Presentation.pptx")
    prs.save(output_path)
    print(f"Presentation successfully saved to: {output_path}")

if __name__ == "__main__":
    create_presentation()
