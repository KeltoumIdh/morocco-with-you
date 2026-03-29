-- Versioned prompt templates + guardrails (run once in Supabase SQL Editor).

CREATE TABLE IF NOT EXISTS prompt_templates (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  version       INT  NOT NULL DEFAULT 1,
  feature       TEXT NOT NULL CHECK (feature IN (
                  'chat_system',
                  'itinerary',
                  'suggest_admin',
                  'recommendations',
                  'guardrail')),
  content       TEXT NOT NULL,
  variables     TEXT[] DEFAULT '{}',
  language      TEXT DEFAULT 'en',
  is_active     BOOLEAN DEFAULT FALSE,
  performance   JSONB DEFAULT '{}',
  notes         TEXT,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (name, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_active_prompt_per_feature
  ON prompt_templates (feature)
  WHERE is_active = TRUE;

INSERT INTO prompt_templates
  (name, version, feature, is_active, content, variables, notes)
VALUES
(
  'chat_system',
  1,
  'chat_system',
  TRUE,
  $PROMPT$
You are the official AI travel guide for Morocco With You,
a premium Moroccan travel platform.

{{catalogue_context}}

INSTRUCTIONS:
- Answer in the same language the user writes in
- When relevant, mention specific items from the catalogue above
- Be specific: use prices, locations, durations from the data only — never invent numbers
- Booking / checkout: the chat cannot take payment or confirm reservations. Tell the user to use the in-app flow: after your reply they can tap "View & book" (or similar) under catalogue sources when shown, open the experience detail page, choose dates and guests, then complete checkout on Morocco With You. Never claim the chat processed a booking.
- Keep responses concise (2–4 sentences)
- Return ONLY valid JSON: {"text":"...","suggestions":["...","...","..."]}
- If no strong catalogue match, give helpful general Morocco advice and suggest exploring the platform
$PROMPT$,
  ARRAY['catalogue_context']::TEXT[],
  'Default RAG chat system prompt (editable in admin)'
),
(
  'guardrail',
  1,
  'guardrail',
  TRUE,
  $PROMPT$
Classify this user message. Return JSON only, no markdown:
{
  "safe": true,
  "category": "travel",
  "redirect": null
}

Use "safe": false only for harmful content, competitor promotion, or topics completely unrelated to travel/Morocco (e.g. politics, medical/legal advice, coding homework).

Allowed categories when safe: "travel", "booking", "platform".
When unsafe or off-topic: category "off_topic" or "harmful" or "competitor", and set "redirect" to a short polite message steering back to Morocco travel (or null to use server default).

User message:
{{user_message}}
$PROMPT$,
  ARRAY['user_message']::TEXT[],
  'Input safety / scope classifier'
)
ON CONFLICT (name, version) DO NOTHING;
