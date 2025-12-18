-- Function: get_itinerary_options
-- Returns active options for a specific category as a JSON array.
-- This bypasses some RLS complexity by being a SECURITY DEFINER function.

CREATE OR REPLACE FUNCTION get_itinerary_options(p_category text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Select active options for the category, ordered by sort_order
  SELECT json_agg(t) INTO result
  FROM (
      SELECT *
      FROM itinerary_options
      WHERE category = p_category
      AND is_active = true
      ORDER BY sort_order ASC
  ) t;
  
  -- Return empty JSON array if no results found, instead of null
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute permissions to all relevant roles
GRANT EXECUTE ON FUNCTION get_itinerary_options(text) TO anon;
GRANT EXECUTE ON FUNCTION get_itinerary_options(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_itinerary_options(text) TO service_role;


-- Function: upsert_itinerary_option
-- Handles creating or updating an itinerary option safely.

CREATE OR REPLACE FUNCTION upsert_itinerary_option(
  p_id uuid,
  p_category text,
  p_label text,
  p_value text,
  p_sort_order int,
  p_icon text,
  p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or Update based on ID
  INSERT INTO itinerary_options (id, category, label, value, sort_order, icon, is_active, updated_at)
  VALUES (
    COALESCE(p_id, gen_random_uuid()), -- Generate new ID if null
    p_category,
    p_label,
    p_value,
    COALESCE(p_sort_order, 0),
    p_icon,
    COALESCE(p_is_active, true),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    label = EXCLUDED.label,
    value = EXCLUDED.value,
    sort_order = EXCLUDED.sort_order,
    icon = EXCLUDED.icon,
    is_active = EXCLUDED.is_active,
    updated_at = now();
    
  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_itinerary_option(uuid, text, text, text, int, text, boolean) TO anon;
GRANT EXECUTE ON FUNCTION upsert_itinerary_option(uuid, text, text, text, int, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_itinerary_option(uuid, text, text, text, int, text, boolean) TO service_role;
