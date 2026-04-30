"use server";

// This file previously held a duplicate of queueForOutreachAction. The
// canonical implementation lives in ./server-actions.ts (written in an
// earlier session) and matches the real tour_targets schema — the table
// does NOT have an artist_id column, so we key on (tour, contact, venue)
// and let the composer/seeder resolve the artist from the package.
//
// Keeping this file as a pure re-export so anything already importing
// "./actions" keeps working.

export { queueForOutreachAction } from "./server-actions";
