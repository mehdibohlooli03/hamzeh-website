"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/app/actions/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// تعریف طرحواره اعتبارسنجی با استفاده از Zod
const formSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  phone: z
    .string()
    .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .min(10, "آدرس باید دقیق‌تر باشد (حداقل ۱۰ کاراکتر)")
    .optional()
    .or(z.literal("")),
});

interface SettingsFormProps {
  user: {
    name?: string | null;
    phone?: string | null;
    address?: string | null;
    email?: string | null;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);

  // راه‌اندازی فرم با مقادیر اولیه دریافتی از دیتابیس (جلوگیری از مقدار null با || "")
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const result = await updateProfile(values);
      if (result.success) {
        toast.success(result.success);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto border-none shadow-none md:border md:shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-right">اطلاعات حساب کاربری</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="text-right">
                  <FormLabel>نام و نام خانوادگی</FormLabel>
                  <FormControl>
                    <Input {...field} className="text-right" />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="text-right">
                  <FormLabel>شماره تماس</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" className="text-left" />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="text-right">
                  <FormLabel>آدرس دقیق</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} className="resize-none text-right" />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <div className="flex justify-start">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={loading}
              >
                {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
