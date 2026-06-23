-- Deduplicate Transferência entries created by both useEffect and earlier migration
-- Keep one per user (prefer the one referenced by entries), drop extras
-- Add unique index to prevent future duplicates

DO $$
DECLARE
  dup RECORD;
  keep_id uuid;
  del_id uuid;
BEGIN
  FOR dup IN
    SELECT user_id, array_agg(id ORDER BY id) AS ids
    FROM origem_types
    WHERE name = 'Transferência' AND account_type = 'milhas'
    GROUP BY user_id
    HAVING count(*) > 1
  LOOP
    -- Prefer the ID that has entries; otherwise keep the first
    SELECT id INTO keep_id FROM origem_types WHERE id = ANY(dup.ids)
      AND id IN (SELECT origem_type_id FROM entries LIMIT 1);
    IF NOT FOUND THEN
      keep_id := dup.ids[1];
    END IF;

    FOR i IN 1 .. array_length(dup.ids, 1) LOOP
      IF dup.ids[i] <> keep_id THEN
        del_id := dup.ids[i];
        UPDATE entries SET origem_type_id = keep_id WHERE origem_type_id = del_id;
        DELETE FROM origem_types WHERE id = del_id;
      END IF;
    END LOOP;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_origem_types_user_transferencia
ON origem_types (user_id) WHERE name = 'Transferência' AND account_type = 'milhas';
