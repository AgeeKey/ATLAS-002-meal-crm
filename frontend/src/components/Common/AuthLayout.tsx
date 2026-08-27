import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Truck,
  UtensilsCrossed,
} from "lucide-react"

import { Appearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import { Footer } from "./Footer"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-background">
      {/* Левая брендированная Hero-панель */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-zinc-950 p-12 text-white selection:bg-emerald-500 selection:text-white">
        {/* Декоративные световые акценты */}
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 size-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Верхний брендинг */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <UtensilsCrossed className="size-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">
                Atlas Meal CRM
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Управление рационами питания
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
            <Sparkles className="size-3" />
            B2B CRM • Бишкек
          </span>
        </div>

        {/* Центральный блок ценности */}
        <div className="relative z-10 my-auto py-8 max-w-lg space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Операционный контроль кухни, рационов и доставок
            </h2>
            <p className="text-sm text-emerald-100/70 leading-relaxed">
              Специализированная B2B-система для управления клиентами, пакетами
              питания 3X/5X, заморозками, оплатами и курьерской логистикой.
            </p>
          </div>

          {/* 3 карточки преимуществ */}
          <div className="grid gap-3">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <UtensilsCrossed className="size-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">
                  Учет рационов 3X и 5X
                </p>
                <p className="text-[11px] text-emerald-100/60 mt-0.5">
                  Ежедневный подсчет порций и готовности кухни без электронных
                  таблиц
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <ShieldCheck className="size-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">
                  Финансы и контроль долгов
                </p>
                <p className="text-[11px] text-emerald-100/60 mt-0.5">
                  Мгновенный учет оплат в сомах (KGS) и предупреждения о
                  дебиторской задолженности
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <Truck className="size-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">
                  Курьерская диспетчеризация
                </p>
                <p className="text-[11px] text-emerald-100/60 mt-0.5">
                  Разделение дня питания клиента и вечерней отправки накануне
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Нижний бейдж стабильности */}
        <div className="relative z-10 flex items-center justify-between text-xs text-emerald-200/60 border-t border-white/10 pt-4">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400" />
            Интерфейс оптимизирован для ежедневной утренней смены
          </span>
          <span>v2.0</span>
        </div>
      </div>

      {/* Правая колонка с формой */}
      <div className="flex flex-col min-h-svh p-6 md:p-10 justify-between">
        {/* Верхняя панель: мобильный логотип + переключатель темы */}
        <div className="flex items-center justify-between w-full">
          <div className="lg:hidden">
            <Logo variant="full" />
          </div>
          <div className="ml-auto">
            <Appearance />
          </div>
        </div>

        {/* Центральная зона с формой */}
        <div className="flex flex-1 items-center justify-center my-6">
          <div className="w-full max-w-sm sm:max-w-md">{children}</div>
        </div>

        {/* Подвал */}
        <Footer />
      </div>
    </div>
  )
}
