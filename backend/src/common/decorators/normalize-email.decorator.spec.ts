import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common'
import { LoginDto, SignupDto } from 'src/auth/dto/auth.dto'

// Mêmes options que le ValidationPipe global de main.ts
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  skipMissingProperties: false,
  transformOptions: { enableImplicitConversion: true },
})

const body = (metatype: ArgumentMetadata['metatype']): ArgumentMetadata => ({ type: 'body', metatype })

describe('NormalizeEmail', () => {
  it('met en minuscules et retire les espaces au login', async () => {
    const result: LoginDto = await pipe.transform(
      { email: '  Dawie@Mail.COM ', password: 'secret123' },
      body(LoginDto)
    )
    expect(result.email).toBe('dawie@mail.com')
  })

  it("normalise l'email à l'inscription", async () => {
    const result: SignupDto = await pipe.transform(
      { email: 'Dawie@Mail.com', password: 'secret123', firstName: 'Dawie', lastName: 'S' },
      body(SignupDto)
    )
    expect(result.email).toBe('dawie@mail.com')
  })

  it('rejette toujours un email invalide', async () => {
    await expect(pipe.transform({ email: 'pas-un-email', password: 'secret123' }, body(LoginDto))).rejects.toThrow(
      BadRequestException
    )
  })
})
