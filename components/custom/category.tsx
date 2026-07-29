import { ArrowRight, Shirt } from "lucide-react";
import Link from "next/link";
interface categories{
    title:string ,
    slug:string ,
    count:string ,
    bgGradient:string , 
    emoji:string ,
    background:string ,
}
export default function CategoryTypes() {
  const categories = [
    {
      title: "شلوار",
      slug: "pants",
      count: "دنیای جین و اسلش",
      bgGradient: "from-blue-600 to-cyan-500",
      emoji: "",
      background:
        "https://padmira.ir/upload/product/orginal_DSC07728_1766473457.jpg",
    },
    {
      title: "هودی و دورس",
      slug: "hoodies",
      count: "استایل گرم و لش",
      bgGradient: "from-amber-600 to-red-500",
      emoji: "",
      background:
        "https://padmira.ir/upload/product/orginal_DSC09856_1763367083.jpg",
    },
    {
      title: "تیشرت",
      slug: "tshirts",
      count: "خنک و راحتی روزمره",
      bgGradient: "from-emerald-600 to-teal-500",
      emoji: "",
      background:
        "https://padmira.ir/upload/product/orginal_DSC08619_1778577689.jpg",
    },
    {
      title: "پیراهن",
      slug: "shirts",
      count: "رسمی و اسپرت کلاسیک",
      bgGradient: "from-purple-600 to-indigo-500",
      emoji: "",
      background:
        "https://padmira.ir/upload/product/orginal_DSC03035_1780745547.jpg",
    },
  ];
  return (
    <>
      <section className="bg container mx-auto px-4 py-8">
        <div className="rounded-3xl  p-8 sm:p-12  shadow-xl shadow-neutral-950/20">
          <div className="mb-10 text-right">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-3">
              <Shirt className="h-3.5 w-3.5 text-amber-400" />
              <span>دسته بندی های محبوب</span>
            </div>
            <h2 className="text-2xl font-black sm:text-3xl leading-relaxed">
              تن‌پوش متناسب با استایل شما
            </h2>
            <p className="text-neutral-400 text-sm mt-2">
              دسته‌بندی مورد نظر خود را انتخاب کنید و وارد دنیای استایل شوید.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat, index) => (
              <Link
                key={index}
                href={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-white/5 p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-48"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center  group-hover:opacity-80 transition-opacity duration-500"
                  style={{ backgroundImage: `url(${cat.background})` }}
                />
                <div className="flex justify-between items-start z-10">
                  <span className="text-4xl filter drop-shadow-md select-none">
                    {cat.emoji}
                  </span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 group-hover:bg-white group-hover:text-black`}
                  >
                    <ArrowRight className="h-4 w-4 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                  </div>
                </div>

                <div className="z-10">
                  <h3 className="text-xl font-bold tracking-tight text-white mb-1 group-hover:text-amber-600 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-neutral-200 group-hover:text-amber-600 transition-colors ">{cat.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
