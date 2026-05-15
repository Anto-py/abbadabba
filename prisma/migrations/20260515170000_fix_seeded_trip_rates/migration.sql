-- Fix trip rates that were seeded with validFrom = createdAt (timestamp at seed
-- time). These appear "more recent" than user-created rates whose validFrom is
-- midnight, breaking the active-rate query. Reset them to 2024-01-01 so any
-- user-created rate clearly wins.
UPDATE "TripRate"
SET "validFrom" = '2024-01-01 00:00:00'::timestamp
WHERE ABS(EXTRACT(EPOCH FROM ("validFrom" - "createdAt"))) < 5;
