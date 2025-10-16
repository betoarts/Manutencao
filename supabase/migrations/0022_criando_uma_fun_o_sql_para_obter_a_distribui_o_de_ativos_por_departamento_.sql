CREATE OR REPLACE FUNCTION public.get_assets_by_department_distribution()
 RETURNS TABLE(department_name text, count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(d.name, 'Sem Departamento') AS department_name,
    count(a.id) AS count
  FROM
    public.assets AS a
  LEFT JOIN
    public.departments AS d ON a.department_id = d.id
  WHERE
    a.user_id = auth.uid()
  GROUP BY
    COALESCE(d.name, 'Sem Departamento');
END;
$function$;