// Some existing rows (e.g. the "General Enquiries" call queue created by
// prisma/seed/index.ts) were seeded with a hardcoded id like
// "00000000-0000-0000-0000-000000000001". It's UUID-*shaped* but not a
// valid RFC 4122 UUID — the version nibble must be 1-5 and the variant
// nibble must be 8/9/A/B, and this id has 0 in both — so class-validator's
// strict @IsUUID() rejects it even though Prisma stores these ids as plain
// `String @id` columns with no such constraint.
//
// This regex validates "UUID-shaped" (8-4-4-4-12 hex) without enforcing the
// RFC 4122 version/variant bits, so genuinely malformed input is still
// rejected while these pre-existing reference-data ids remain valid.
export const UUID_SHAPE_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
