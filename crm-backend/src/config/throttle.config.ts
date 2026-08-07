import { registerAs } from '@nestjs/config'

export default registerAs('throttle', () => ({
  ttl:        parseInt(process.env.THROTTLE_TTL   ?? '60000', 10),
  limit:      parseInt(process.env.THROTTLE_LIMIT ?? '100',   10),
  loginLimit: parseInt(process.env.THROTTLE_LOGIN_LIMIT ?? '10', 10),
}))
