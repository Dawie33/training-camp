import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common'
import { SignupDto } from './auth.dto'

// Mêmes options que le ValidationPipe global de main.ts
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  skipMissingProperties: false,
  transformOptions: { enableImplicitConversion: true },
})

const metadata: ArgumentMetadata = { type: 'body', metatype: SignupDto }

function validate(body: Record<string, unknown>): Promise<SignupDto> {
  return pipe.transform(body, metadata)
}

describe('SignupDto (POST /auth/signup)', () => {
  const signup = { email: 'dawie@mail.com', password: 'secret123', firstName: 'Dawie', lastName: 'Sy' }

  it('accepte un mot de passe de 72 octets, la limite de bcrypt', async () => {
    const body = { ...signup, password: 'a'.repeat(72) }
    await expect(validate(body)).resolves.toEqual(expect.objectContaining(body))
  })

  it.each([
    ['un mot de passe de moins de 6 caractères', 'abc12'],
    // bcrypt ignorerait le 73e octet : deux mots de passe différents donneraient le même hash
    ['un mot de passe de 73 octets', 'a'.repeat(73)],
    ['40 caractères accentués (80 octets en UTF-8)', 'é'.repeat(40)],
  ])('rejette %s', async (_case, password) => {
    await expect(validate({ ...signup, password })).rejects.toThrow(BadRequestException)
  })
})
