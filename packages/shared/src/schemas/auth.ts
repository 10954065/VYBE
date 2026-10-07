import { z } from "zod";

const email = z.email("Enter a valid email address.");
const password = z.string().min(8, "At least 8 characters.");

export const signUpInputSchema = z.object({ email, password });
export type SignUpInput = z.infer<typeof signUpInputSchema>;

export const signInInputSchema = z.object({ email, password });
export type SignInInput = z.infer<typeof signInInputSchema>;

export const requestPasswordResetInputSchema = z.object({ email });
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetInputSchema>;
