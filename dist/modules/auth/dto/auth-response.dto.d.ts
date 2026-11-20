export declare class AuthUserDto {
    id: string;
    email: string;
    employeeId: string | null;
    roles: string[];
    firstName: string | null;
    lastName: string | null;
}
export declare class LoginSuccessDto {
    requires2FA: false;
    accessToken: string;
    refreshToken: string;
    user: AuthUserDto;
}
export declare class LoginChallengeDto {
    requires2FA: true;
    challengeToken: string;
    demoCodeHint: string;
}
