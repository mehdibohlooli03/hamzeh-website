import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, Headset } from "lucide-react";


export function SiteFooter() {
  return (
    <footer className="w-full border-t border-gray-100 bg-white" dir="rtl">
      {/* بخش مزایای خرید */}
      <div className="border-b border-gray-50 bg-gray-50/50 py-8">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 md:grid-cols-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 sm:text-sm">ارسال سریع</h4>
              <p className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">تحویل درب منزل</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 sm:text-sm">ضمانت اصالت</h4>
              <p className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">پوشاک باکیفیت عالی</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 sm:text-sm">ضمانت بازگشت</h4>
              <p className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">تا ۷ روز امکان بازگشت</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <Headset className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 sm:text-sm">پشتیبانی آنلاین</h4>
              <p className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">همواره پاسخگوی شما</p>
            </div>
          </div>
        </div>
      </div>

      {/* بخش لینک‌ها و درباره فروشگاه */}
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* بخش درباره برند */}
          <div className="md:col-span-6 lg:col-span-5">
            <Link href="/" className="text-xl font-black tracking-wider text-black">
              REAL HAMZEH
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-gray-500">
              مجموعه پوشاک حمزه ارائه‌دهنده باکیفیت‌ترین لباس‌های مردانه و اسپرت، مناسب استایل‌های روزمره و خیابانی. ما متعهد به ارائه بهترین خدمات و تجربه خرید لذت‌بخش هستیم.
            </p>
          </div>

          {/* بخش لینک‌های سریع */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:col-span-6 lg:col-span-7">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900">دسترسی سریع</h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/products" className="text-gray-500 hover:text-black">
                    تمامی محصولات
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=tshirts" className="text-gray-500 hover:text-black">
                    تیشرت
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=pants" className="text-gray-500 hover:text-black">
                    شلوار
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=hoodies" className="text-gray-500 hover:text-black">
                    هودی و دورس
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900">پشتیبانی و ارتباط</h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/orders" className="text-gray-500 hover:text-black">
                    پیگیری سفارشات
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="text-gray-500 hover:text-black">
                    سبد خرید
                  </Link>
                </li>
                <li className="text-gray-500">
                  تلفن پشتیبانی: <span className="font-mono">۰۹۳۹۳۹۳۷۳۳۵</span>
                </li>
                <li className="text-gray-500">مشهد ، خیابان سحر،فروشگاه حمزه</li>
              </ul>
            </div>
          </div>
        </div>

        {/* بخش کپی رایت */}
        <div className="mt-12 border-t border-gray-100 pt-6 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} فروشگاه پوشاک REAL HAMZEH. تمامی حقوق محفوظ است.
          </p>
          {/* <Instagram className="h-5 w-5 text-pink-500" /> */}

        </div>
        
      </div>
    </footer>
  );
}
