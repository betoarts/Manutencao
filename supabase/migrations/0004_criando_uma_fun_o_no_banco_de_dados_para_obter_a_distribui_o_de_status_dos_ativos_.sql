CREATE OR REPLACE FUNCTION get_asset_status_distribution()
RETURNS TABLE(status TEXT, count BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.status,
    count(a.id)
  FROM
    public.assets AS a
  WHERE
    a.user_id = auth.uid()
  GROUP BY
    a.status;
END;
$$;