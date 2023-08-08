import { SetMetadata } from '@nestjs/common'

export const D_C_WITHOUT_JWT = 'withoutJWT'

export const WithoutJwt = () => SetMetadata(D_C_WITHOUT_JWT, true)
