import { z } from "zod";

export const PAYMENT_TYPES = ["FULL", "DEPOSIT"] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number];

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizePhone(value: string) {
  return toEnglishDigits(value).replace(/\D/g, "");
}

export function sanitizePostalCode(value: string) {
  return toEnglishDigits(value).replace(/\D/g, "");
}

export function sanitizeShippingAddress(value: string) {
  return normalizeWhitespace(value);
}

export function normalizeCheckoutFormInput(input: {
  shippingAddress: string;
  postalCode: string;
  phone: string;
  paymentType: PaymentType;
}) {
  return {
    shippingAddress: sanitizeShippingAddress(input.shippingAddress),
    postalCode: sanitizePostalCode(input.postalCode),
    phone: sanitizePhone(input.phone),
    paymentType: input.paymentType,
  };
}

const shippingAddressSchema = z
  .string()
  .trim()
  .min(1, "آدرس پستی الزامی است.")
  .transform((val) => sanitizeShippingAddress(val))
  .pipe(
    z
      .string()
      .min(15, "آدرس باید حداقل ۱۵ کاراکتر باشد.")
      .max(500, "آدرس نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد.")
      .refine((value) => /[A-Za-zآ-ی]/.test(value), {
        message: "آدرس باید شامل متن معتبر باشد.",
      })
      .refine((value) => !/^\d+$/.test(value), {
        message: "آدرس نمی‌تواند فقط شامل عدد باشد.",
      })
  );

const postalCodeSchema = z
  .string()
  .trim()
  .min(1, "کد پستی الزامی است.")
  .transform((val) => sanitizePostalCode(val))
  .pipe(
    z
      .string()
      .length(10, "کد پستی باید دقیقاً ۱۰ رقم باشد.")
      .refine((value) => /^\d{10}$/.test(value), {
        message: "کد پستی باید فقط شامل عدد باشد.",
      })
  );

const phoneSchema = z
  .string()
  .trim()
  .min(1, "شماره تماس الزامی است.")
  .transform((val) => sanitizePhone(val))
  .pipe(
    z
      .string()
      .length(11, "شماره تماس باید ۱۱ رقم باشد.")
      .refine((value) => /^\d{11}$/.test(value), {
        message: "شماره تماس باید فقط شامل عدد باشد.",
      })
      .refine((value) => value.startsWith("09"), {
        message: "شماره تماس باید با 09 شروع شود.",
      })
  );

const paymentTypeSchema = z.enum(PAYMENT_TYPES, {
  message: "نوع پرداخت نامعتبر است.",
});

export const checkoutItemSchema = z.object({
  variantId: z
    .string()
    .trim()
    .min(1, "شناسه محصول نامعتبر است."),
  quantity: z
    .number()
    .int("تعداد باید عدد صحیح باشد.")
    .min(1, "تعداد هر آیتم باید حداقل ۱ باشد."),
});

export const checkoutFormSchema = z.object({
  shippingAddress: shippingAddressSchema,
  postalCode: postalCodeSchema,
  phone: phoneSchema,
  paymentType: paymentTypeSchema,
});

export const createOrderSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "سبد خرید شما خالی است."),
  shippingAddress: shippingAddressSchema,
  postalCode: postalCodeSchema,
  phone: phoneSchema,
  paymentType: paymentTypeSchema,
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export type CreateOrderPayload = z.infer<typeof createOrderSchema>;
