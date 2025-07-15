// Compares plain password with stored hash
export async function isValidPassword(
  password: string,
  hashedPassword: string
) {
  //  Hash input and match with stored hashed value
  return (await hashPassword(password)) === hashedPassword
}

// Hashing helper: converts password → SHA‑512 → Base64
async function hashPassword(password: string) {
  // Encode string to bytes, then hash with SHA-512
  const arrayBuffer = await crypto.subtle.digest(
    "SHA-512",
    new TextEncoder().encode(password)
  )

  // Convert binary hash to Base64 for safe storage & comparison
  return Buffer.from(arrayBuffer).toString("base64")
}
