import { Body, Controller, Get, Headers, Patch, Post } from "@nestjs/common";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class RegisterDto extends LoginDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  street!: string;

  @IsOptional()
  @IsString()
  street2?: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  country!: string;

  @IsOptional()
  @IsString()
  rfc?: string;

  @IsOptional()
  @IsString()
  fiscalRegime?: string;
}

class ActivateOdooAccountDto extends LoginDto {}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  street2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  vat?: string;

  @IsOptional()
  @IsString()
  l10n_mx_edi_fiscal_regime?: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.auth.register({
      email: body.email,
      password: body.password,
      name: body.name,
      phone: body.phone,
      street: body.street,
      street2: body.street2,
      city: body.city,
      state: body.state,
      country: body.country,
      rfc: body.rfc,
      fiscalRegime: body.fiscalRegime,
    });
  }

  @Post("activate-odoo-account")
  activateOdooAccount(@Body() body: ActivateOdooAccountDto) {
    return this.auth.activateOdooAccount({
      email: body.email,
      password: body.password,
    });
  }

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }

  @Get("me")
  me(@Headers("authorization") authorization?: string) {
    return this.auth.getMe(authorization);
  }

  @Patch("me")
  updateMe(@Headers("authorization") authorization: string | undefined, @Body() body: UpdateProfileDto) {
    return this.auth.updateMe(authorization, body);
  }
}
