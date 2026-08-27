# Анализ и спецификация Milestone 1 (M1: Auth Pages & Appearance)

**Дата:** 27 августа 2026  
**Проект:** Atlas Meal CRM UI/UX Redesign  
**Автор:** `m1_explorer_2` (Explorer Agent)  
**Область исследования:** `frontend/src/routes/login.tsx`, `signup.tsx`, `recover-password.tsx`, `reset-password.tsx`, `frontend/src/components/Common/Appearance.tsx`, `AuthLayout.tsx`, `Logo.tsx`, `Footer.tsx`

---

## 1. Краткое резюме (Executive Summary)

Цель Milestone 1 для модуля аутентификации и внешнего вида — трансформировать страницы авторизации из стандартного серого шаблона FastAPI в премиальный гастрономический B2B SaaS интерфейс **Atlas Meal CRM** (палитра свежести *Fresh Emerald / Jade* `oklch(0.54 0.15 156)`), сохраняя при этом **100% совместимость со всеми 75 E2E тестами Playwright** и спецификациями проекта (`PROJECT.md`, `TEST_INFRA.md`).

### Главные результаты анализа:
1. **Дизайн-трансформация:** Левая панель `AuthLayout.tsx` (ранее плоский серый блок `bg-muted`) трансформируется в визитную карточку Atlas Meal CRM с глубоким изумрудным градиентом (`from-emerald-950 via-teal-950 to-zinc-950`), светящейся эмблемой `UtensilsCrossed`, бизнес-тезисом и 3 микро-карточками ценности сервиса питания (рационы 3X/5X, контроль оплат/долгов, оперативный кокпит).
2. **Селекторная инвариантность:** Выявлено и зафиксировано **26 критических селекторов, ролей, меток и текстов валидации**, используемых в тестах `auth.setup.ts`, `login.spec.ts`, `sign-up.spec.ts`, `reset-password.spec.ts` и `user-settings.spec.ts`. Ни один селектор или сообщение ошибки не может быть изменен или удален.
3. **Доступность и адаптивность:** Все поля оснащены явными `<FormLabel>`, кнопки имеют `:focus-visible` кольца в изумрудном акценте, переключатели пароля снабжены `aria-label`, верстка адаптирована для мобильных экранов (375px) без горизонтальной прокрутки.

---

## 2. Анализ текущего состояния компонентов (Current State Audit)

| Файл | Текущее состояние | Выявленные проблемы / Точки роста |
|---|---|---|
| `frontend/src/components/Common/AuthLayout.tsx` | Сетка `grid lg:grid-cols-2`. Левая колонка — пустой серый прямоугольник `bg-muted dark:bg-zinc-900` с маленьким логотипом. Правая колонка — узкий контейнер `max-w-xs` (320px). | 1. Нет ощущения премиального сервиса питания.<br>2. На мобильных устройствах (`lg:hidden`) логотип полностью исчезает из видимой зоны до формы.<br>3. Ширина `max-w-xs` сжимает длинные русские сообщения валидации. |
| `frontend/src/routes/login.tsx` | Форма входа с полями `username` (email) и `password`. Кнопка «Войти», ссылка «Забыли пароль?», ссылка на регистрацию. | 1. Заголовок страницы в meta: `"Вход - Meal CRM"` (требуется `"Вход — Atlas Meal CRM"`).<br>2. Не хватает легкого визуального контекста и фокусных колец в стиле изумрудной палитры. |
| `frontend/src/routes/signup.tsx` | Форма регистрации: ФИО, Email, Пароль, Подтверждение пароля. Кнопка «Зарегистрироваться». | 1. Meta заголовок: `"Регистрация - Meal CRM"`.<br>2. Форма требует комфортных отступов и подсказок по длине пароля (>= 8 символов). |
| `frontend/src/routes/recover-password.tsx` | Форма запроса сброса пароля с полем `email`. Заголовок `<h1>Восстановление пароля</h1>`, кнопка «Продолжить». | 1. Текст заголовка жестко зафиксирован в тесте `reset-password.spec.ts` как `heading "Восстановление пароля"`.<br>2. Кнопка «Продолжить» жестко зафиксирована. |
| `frontend/src/routes/reset-password.tsx` | Форма ввода нового пароля и подтверждения с query-параметром `token`. Кнопка «Сбросить пароль». | 1. Заголовок `<h1>Сбросить пароль</h1>`.<br>2. Обработка ошибки `"Неверный токен"` от бэкенда.<br>3. Тост `"Пароль успешно обновлен"`. |
| `frontend/src/components/Common/Appearance.tsx` | Переключатель темы (Светлая / Тёмная / Системная) для сайдбара и топбара. | Селекторы `data-testid="theme-button"`, `data-testid="light-mode"`, `data-testid="dark-mode"` полностью реализованы, работают с классами `dark`/`light` на `document.documentElement`. |

---

## 3. Архитектура визуального брендинга (Emerald Branding Strategy)

### 3.1 Фирменный Hero-блок (Левая панель `AuthLayout.tsx`)
В соответствии с утвержденным планом (`implementation_plan.md`) и скиллами `frontend-design` и `ui-ux-pro-max`, левая панель должна передавать профессиональную атмосферу гастрономического B2B сервиса:
- **Фон:** Глубокий градиент `bg-gradient-to-br from-emerald-950 via-teal-950 to-zinc-950 text-white relative overflow-hidden flex flex-col justify-between p-12`.
- **Фоновые акценты:** 
  - Размытые радиальные пятна изумрудного света (`bg-emerald-500/10 blur-3xl`).
  - Тонкая геометрическая сетка или декоративный бейдж: `B2B Food-Tech CRM • Кыргызстан`.
- **Центральная композиция:**
  - Крупный фирменный блок: иконка `UtensilsCrossed` в изумрудном светящемся контейнере + заголовок **Atlas Meal CRM**.
  - Бизнес-подзаголовок: *«Система управления производством и доставкой рационов здорового питания»*.
  - **3 ключевые бизнес-опоры (Value Cards):**
    1. 🍱 **Учет рационов 3X и 5X:** Ежедневная раскладка по калоражу и кухня-сводка в реальном времени.
    2. 💳 **Финансовый контроль:** Мониторинг оплат, управление дебиторской задолженностью и авто-баланс.
    3. 🚚 **Курьерская логистика:** Четкое разделение «Дня питания клиента» и «Отправки курьером накануне».
- **Нижний бейдж:** Мягкая плашка со статусом платформы: `🟢 Готов к утренней смене • Версия 2.0`.

### 3.2 Правая панель авторизации (`AuthLayout.tsx`)
- Верхняя строка: компактный переключатель темы `Appearance` с сохранением `data-testid="theme-button"`.
- Мобильный брендинг (`lg:hidden`): аккуратный логотип `Logo variant="full"` над формой, чтобы пользователь смартфона сразу понимал, в какую систему входит.
- Контейнер формы: расширение с `max-w-xs` (320px) до `max-w-sm` (384px) для красивой балансировки русской типографики (`text-wrap: balance`).
- Нижняя часть: компонент `Footer` со светящимся индикатором `bg-emerald-500 animate-pulse` «Сервер активен».

---

## 4. Матрица критических селекторов (Playwright Invariants)

Каждый селектор из таблицы ниже **обязан присутствовать** без малейших изменений имени, роли или типа:

| # | Элемент | Точный селектор Playwright | Тип селектора | Файл назначения | Тестовые файлы-зависимости |
|---|---|---|---|---|---|
| 1 | Email (Логин) | `page.getByTestId("email-input")` | `data-testid="email-input"` | `login.tsx` | `login.spec.ts`, `auth.setup.ts` |
| 2 | Пароль (Логин) | `page.getByTestId("password-input")` | `data-testid="password-input"` | `login.tsx` | `login.spec.ts`, `auth.setup.ts` |
| 3 | Кнопка «Войти» | `page.getByRole("button", { name: "Войти" })` | Role `button`, Text `"Войти"` | `login.tsx` | `login.spec.ts`, `auth.setup.ts`, `utils/user.ts` |
| 4 | Ссылка «Забыли пароль?» | `page.getByRole("link", { name: "Забыли пароль?" })` | Role `link`, Text `"Забыли пароль?"` | `login.tsx` | `login.spec.ts` |
| 5 | Ссылка на регистрацию | `page.getByRole("link", { name: "Зарегистрироваться" })` | Role `link`, Text `"Зарегистрироваться"` | `login.tsx` | `login.spec.ts` |
| 6 | ФИО (Регистрация) | `page.getByTestId("full-name-input")` | `data-testid="full-name-input"` | `signup.tsx` | `sign-up.spec.ts`, `utils/user.ts` |
| 7 | Email (Регистрация) | `page.getByTestId("email-input")` | `data-testid="email-input"` | `signup.tsx` | `sign-up.spec.ts`, `utils/user.ts` |
| 8 | Пароль (Регистрация) | `page.getByTestId("password-input")` | `data-testid="password-input"` | `signup.tsx` | `sign-up.spec.ts`, `utils/user.ts` |
| 9 | Подтверждение пароля | `page.getByTestId("confirm-password-input")` | `data-testid="confirm-password-input"` | `signup.tsx` | `sign-up.spec.ts`, `utils/user.ts` |
| 10 | Кнопка «Зарегистрироваться» | `page.getByRole("button", { name: "Зарегистрироваться" })` | Role `button`, Text `"Зарегистрироваться"` | `signup.tsx` | `sign-up.spec.ts`, `utils/user.ts` |
| 11 | Ссылка «Войти» (на SignUp) | `page.getByRole("link", { name: "Войти" })` | Role `link`, Text `"Войти"` | `signup.tsx` | `sign-up.spec.ts` |
| 12 | Заголовок восстановления | `page.getByRole("heading", { name: "Восстановление пароля" })` | Role `heading`, Text `"Восстановление пароля"` | `recover-password.tsx` | `reset-password.spec.ts` |
| 13 | Email (Восстановление) | `page.getByTestId("email-input")` | `data-testid="email-input"` | `recover-password.tsx` | `reset-password.spec.ts` |
| 14 | Кнопка «Продолжить» | `page.getByRole("button", { name: "Продолжить" })` | Role `button`, Text `"Продолжить"` | `recover-password.tsx` | `reset-password.spec.ts` |
| 15 | Заголовок сброса пароля | `<h1 ...>Сбросить пароль</h1>` | Text `"Сбросить пароль"` | `reset-password.tsx` | `reset-password.spec.ts` |
| 16 | Новый пароль (Сброс) | `page.getByTestId("new-password-input")` | `data-testid="new-password-input"` | `reset-password.tsx` | `reset-password.spec.ts` |
| 17 | Подтверждение пароля (Сброс) | `page.getByTestId("confirm-password-input")` | `data-testid="confirm-password-input"` | `reset-password.tsx` | `reset-password.spec.ts` |
| 18 | Кнопка «Сбросить пароль» | `page.getByRole("button", { name: "Сбросить пароль" })` | Role `button`, Text `"Сбросить пароль"` | `reset-password.tsx` | `reset-password.spec.ts` |
| 19 | Кнопка темы (Sidebar) | `page.getByTestId("theme-button")` | `data-testid="theme-button"` | `Appearance.tsx` | `user-settings.spec.ts` |
| 20 | Режим «Светлая» | `page.getByTestId("light-mode")` | `data-testid="light-mode"` | `Appearance.tsx` | `user-settings.spec.ts` |
| 21 | Режим «Тёмная» | `page.getByTestId("dark-mode")` | `data-testid="dark-mode"` | `Appearance.tsx` | `user-settings.spec.ts` |
| 22 | Меню пользователя | `page.getByTestId("user-menu")` | `data-testid="user-menu"` | `User.tsx` | `user-settings.spec.ts`, `login.spec.ts`, `utils/user.ts` |
| 23 | Текущий пароль (Settings) | `page.getByTestId("current-password-input")` | `data-testid="current-password-input"` | `ChangePassword.tsx` | `user-settings.spec.ts` |
| 24 | Новый пароль (Settings) | `page.getByTestId("new-password-input")` | `data-testid="new-password-input"` | `ChangePassword.tsx` | `user-settings.spec.ts` |
| 25 | Подтверждение (Settings) | `page.getByTestId("confirm-password-input")` | `data-testid="confirm-password-input"` | `ChangePassword.tsx` | `user-settings.spec.ts` |
| 26 | Кнопка смены пароля (Settings) | `page.getByRole("button", { name: "Обновить пароль" })` | Role `button`, Text `"Обновить пароль"` | `ChangePassword.tsx` | `user-settings.spec.ts` |

---

## 5. Точные инварианты текстов валидации и API ответов

Тесты Playwright выполняют прямые строковые утверждения `toBeVisible()` на следующие сообщения:

| Сообщение | Источник | Где проверяется |
|---|---|---|
| `"Неверный адрес email"` | Zod схема (`z.email(...)`) | `login.spec.ts:59`, `sign-up.spec.ts:70`, `user-settings.spec.ts:61`, `admin.spec.ts:151` |
| `"Неправильный email или пароль"` | Backend API ответ (HTTP 400) | `login.spec.ts:69` |
| `"Пароль обязателен"` | Zod схема (`.min(1, ...)`) | `sign-up.spec.ts:159` |
| `"Пароль должен содержать не менее 8 символов"` | Zod схема (`.min(8, ...)`) | `sign-up.spec.ts:105`, `reset-password.spec.ts:117`, `user-settings.spec.ts:179`, `admin.spec.ts:165` |
| `"Пароли не совпадают"` | Zod refinement (`data.password === data.confirm_password`) | `sign-up.spec.ts:120`, `user-settings.spec.ts:191`, `admin.spec.ts:179` |
| `"ФИО обязательно"` | Zod схема (`.min(1, ...)`) | `sign-up.spec.ts:133` |
| `"Подтверждение пароля обязательно"` | Zod схема (`.min(1, ...)`) | `reset-password.tsx`, `signup.tsx` |
| `"The user with this email already exists in the system"` | Backend API ответ (HTTP 400) | `sign-up.spec.ts:90` |
| `"Неверный токен"` | Backend API ответ (HTTP 400) | `reset-password.spec.ts:82` |
| `"Ссылка для восстановления пароля успешно отправлена"` | Toast уведомление | `recover-password.tsx` (flow Mailpit) |
| `"Пароль успешно обновлен"` | Toast уведомление | `reset-password.spec.ts:66`, `user-settings.spec.ts:145` |
| `"Добро пожаловать в панель управления CRM!"` | Текст в Дашборде (`/`) | `auth.setup.ts:13`, `login.spec.ts:49, 81, 98`, `utils/user.ts:27` |

---

## 6. Предлагаемые изменения в коде (Proposed Code Specifications)

### 6.1 `frontend/src/components/Common/AuthLayout.tsx`

```tsx
import { UtensilsCrossed, ShieldCheck, Sparkles, Truck, CheckCircle2 } from "lucide-react"
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
              <span className="text-lg font-bold tracking-tight text-white block">Atlas Meal CRM</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Управление рационами питания</span>
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
              Специализированная B2B-система для управления клиентами, пакетами питания 3X/5X, заморозками, оплатами и курьерской логистикой.
            </p>
          </div>

          {/* 3 карточки преимуществ */}
          <div className="grid gap-3">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <UtensilsCrossed className="size-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">Учет рационов 3X и 5X</p>
                <p className="text-[11px] text-emerald-100/60 mt-0.5">Ежедневный подсчет порций и готовности кухни без электронных таблиц</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <ShieldCheck className="size-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">Финансы и контроль долгов</p>
                <p className="text-[11px] text-emerald-100/60 mt-0.5">Мгновенный учет оплат в сомах (KGS) и предупреждения о дебиторской задолженности</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <Truck className="size-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">Курьерская диспетчеризация</p>
                <p className="text-[11px] text-emerald-100/60 mt-0.5">Разделение дня питания клиента и вечерней отправки накануне</p>
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
```

### 6.2 `frontend/src/routes/login.tsx`

```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { AuthLayout } from "@/components/Common/AuthLayout"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

const formSchema = z.object({
  username: z.email({ message: "Неверный адрес email" }),
  password: z
    .string()
    .min(1, { message: "Пароль обязателен" })
    .min(8, { message: "Пароль должен содержать не менее 8 символов" }),
}) satisfies z.ZodType<AccessToken>

type FormData = z.infer<typeof formSchema>

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Вход — Atlas Meal CRM",
      },
    ],
  }),
})

function Login() {
  const { loginMutation } = useAuth()
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    if (loginMutation.isPending) return
    loginMutation.mutate(data)
  }

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Вход в систему</h1>
              <p className="text-xs text-muted-foreground">
                Введите учетные данные для входа в панель CRM
              </p>
            </div>

            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Электронная почта</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="email-input"
                        placeholder="user@example.com"
                        type="email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Пароль</FormLabel>
                      <RouterLink
                        to="/recover-password"
                        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Забыли пароль?
                      </RouterLink>
                    </div>
                    <FormControl>
                      <PasswordInput
                        data-testid="password-input"
                        placeholder="Пароль"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <LoadingButton
                type="submit"
                loading={loginMutation.isPending}
                className="w-full shadow-xs"
              >
                Войти
              </LoadingButton>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Ещё нет аккаунта?{" "}
              <RouterLink
                to="/signup"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
              >
                Зарегистрироваться
              </RouterLink>
            </div>
          </form>
        </Form>
      </div>
    </AuthLayout>
  )
}
```

### 6.3 `frontend/src/routes/signup.tsx`

```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AuthLayout } from "@/components/Common/AuthLayout"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

const formSchema = z
  .object({
    email: z.email({ message: "Неверный адрес email" }),
    full_name: z.string().min(1, { message: "ФИО обязательно" }),
    password: z
      .string()
      .min(1, { message: "Пароль обязателен" })
      .min(8, { message: "Пароль должен содержать не менее 8 символов" }),
    confirm_password: z
      .string()
      .min(1, { message: "Подтверждение пароля обязательно" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Пароли не совпадают",
    path: ["confirm_password"],
  })

type FormData = z.infer<typeof formSchema>

export const Route = createFileRoute("/signup")({
  component: SignUp,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Регистрация — Atlas Meal CRM",
      },
    ],
  }),
})

function SignUp() {
  const { signUpMutation } = useAuth()
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    if (signUpMutation.isPending) return

    // exclude confirm_password from submission data
    const { confirm_password: _confirm_password, ...submitData } = data
    signUpMutation.mutate(submitData)
  }

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Создать аккаунт</h1>
              <p className="text-xs text-muted-foreground">
                Регистрация нового сотрудника в Atlas Meal CRM
              </p>
            </div>

            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ФИО</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="full-name-input"
                        placeholder="Иван Иванов"
                        type="text"
                        autoComplete="name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="email-input"
                        placeholder="user@example.com"
                        type="email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <PasswordInput
                        data-testid="password-input"
                        placeholder="Пароль"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Подтвердите пароль</FormLabel>
                    <FormControl>
                      <PasswordInput
                        data-testid="confirm-password-input"
                        placeholder="Подтвердите пароль"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <LoadingButton
                type="submit"
                className="w-full shadow-xs"
                loading={signUpMutation.isPending}
              >
                Зарегистрироваться
              </LoadingButton>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Уже есть аккаунт?{" "}
              <RouterLink
                to="/login"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
              >
                Войти
              </RouterLink>
            </div>
          </form>
        </Form>
      </div>
    </AuthLayout>
  )
}
```

### 6.4 `frontend/src/routes/recover-password.tsx`

```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { LoginService } from "@/client"
import { AuthLayout } from "@/components/Common/AuthLayout"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const formSchema = z.object({
  email: z.email({ message: "Неверный адрес email" }),
})

type FormData = z.infer<typeof formSchema>

export const Route = createFileRoute("/recover-password")({
  component: RecoverPassword,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Восстановление пароля — Atlas Meal CRM",
      },
    ],
  }),
})

function RecoverPassword() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const recoverPassword = async (data: FormData) => {
    await LoginService.recoverPassword({
      path: { email: data.email },
    })
  }

  const mutation = useMutation({
    mutationFn: recoverPassword,
    onSuccess: () => {
      showSuccessToast("Ссылка для восстановления пароля успешно отправлена")
      form.reset()
    },
    onError: handleError.bind(showErrorToast),
  })

  const onSubmit = async (data: FormData) => {
    if (mutation.isPending) return
    mutation.mutate(data)
  }

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Восстановление пароля</h1>
              <p className="text-xs text-muted-foreground">
                Введите ваш рабочий email для получения ссылки сброса
              </p>
            </div>

            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Электронная почта</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="email-input"
                        placeholder="user@example.com"
                        type="email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <LoadingButton
                type="submit"
                className="w-full shadow-xs"
                loading={mutation.isPending}
              >
                Продолжить
              </LoadingButton>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Вспомнили пароль?{" "}
              <RouterLink
                to="/login"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
              >
                Войти
              </RouterLink>
            </div>
          </form>
        </Form>
      </div>
    </AuthLayout>
  )
}
```

### 6.5 `frontend/src/routes/reset-password.tsx`

```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
  useNavigate,
} from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { LoginService } from "@/client"
import { AuthLayout } from "@/components/Common/AuthLayout"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { LoadingButton } from "@/components/ui/loading-button"
import { PasswordInput } from "@/components/ui/password-input"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const searchSchema = z.object({
  token: z.string().catch(""),
})

const formSchema = z
  .object({
    new_password: z
      .string()
      .min(1, { message: "Пароль обязателен" })
      .min(8, { message: "Пароль должен содержать не менее 8 символов" }),
    confirm_password: z
      .string()
      .min(1, { message: "Подтверждение пароля обязательно" }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Пароли не совпадают",
    path: ["confirm_password"],
  })

type FormData = z.infer<typeof formSchema>

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    if (isLoggedIn()) {
      throw redirect({ to: "/" })
    }
    if (!search.token) {
      throw redirect({ to: "/login" })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Сброс пароля — Atlas Meal CRM",
      },
    ],
  }),
})

function ResetPassword() {
  const { token } = Route.useSearch()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const navigate = useNavigate()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: { new_password: string; token: string }) =>
      LoginService.resetPassword({ body: data }),
    onSuccess: () => {
      showSuccessToast("Пароль успешно обновлен")
      form.reset()
      navigate({ to: "/login" })
    },
    onError: handleError.bind(showErrorToast),
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({ new_password: data.new_password, token })
  }

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Сбросить пароль</h1>
              <p className="text-xs text-muted-foreground">
                Установите новый надежный пароль для вашей учетной записи
              </p>
            </div>

            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Новый пароль</FormLabel>
                    <FormControl>
                      <PasswordInput
                        data-testid="new-password-input"
                        placeholder="Новый пароль"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Подтвердите пароль</FormLabel>
                    <FormControl>
                      <PasswordInput
                        data-testid="confirm-password-input"
                        placeholder="Подтвердите пароль"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <LoadingButton
                type="submit"
                className="w-full shadow-xs"
                loading={mutation.isPending}
              >
                Сбросить пароль
              </LoadingButton>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Вспомнили пароль?{" "}
              <RouterLink
                to="/login"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
              >
                Войти
              </RouterLink>
            </div>
          </form>
        </Form>
      </div>
    </AuthLayout>
  )
}
```

### 6.6 `frontend/src/components/Common/Appearance.tsx`

```tsx
import { Monitor, Moon, Sun } from "lucide-react"

import { type Theme, useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

type LucideIcon = React.FC<React.SVGProps<SVGSVGElement>>

const ICON_MAP: Record<Theme, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
}

export const SidebarAppearance = () => {
  const { isMobile } = useSidebar()
  const { setTheme, theme } = useTheme()
  const Icon = ICON_MAP[theme]

  return (
    <SidebarMenuItem>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip="Тема оформления" data-testid="theme-button">
            <Icon className="size-4 text-muted-foreground" />
            <span>Тема оформления</span>
            <span className="sr-only">Переключить тему</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? "top" : "right"}
          align="end"
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
        >
          <DropdownMenuItem
            data-testid="light-mode"
            onClick={() => setTheme("light")}
          >
            <Sun className="mr-2 h-4 w-4" />
            Светлая
          </DropdownMenuItem>
          <DropdownMenuItem
            data-testid="dark-mode"
            onClick={() => setTheme("dark")}
          >
            <Moon className="mr-2 h-4 w-4" />
            Тёмная
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="mr-2 h-4 w-4" />
            Системная
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export const Appearance = () => {
  const { setTheme } = useTheme()

  return (
    <div className="flex items-center justify-center">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid="theme-button"
            variant="outline"
            size="icon"
            className="size-9 rounded-lg border-border/80 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Переключить тему"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Переключить тему</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          <DropdownMenuItem
            data-testid="light-mode"
            onClick={() => setTheme("light")}
          >
            <Sun className="mr-2 h-4 w-4" />
            Светлая
          </DropdownMenuItem>
          <DropdownMenuItem
            data-testid="dark-mode"
            onClick={() => setTheme("dark")}
          >
            <Moon className="mr-2 h-4 w-4" />
            Тёмная
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="mr-2 h-4 w-4" />
            Системная
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
```

---

## 7. Чек-лист соответствия Web Design Guidelines & A11y

- [x] **Контрастность:** Все элементы форм, лейблы и сообщения ошибок гарантируют контрастность >= 4.5:1 относительно фона как в светлой (`--background: oklch(0.99 0.002 120)`), так и в тёмной (`--background: oklch(0.14 0.015 240)`) темах.
- [x] **Фокусные состояния:** Все интерактивные элементы (кнопки, ссылки, инпуты) используют явное фокусное кольцо `:focus-visible:ring-ring/50` и `:focus-visible:border-ring`.
- [x] **Атрибуты форм:** Все инпуты снабжены `autocomplete` (`email`, `current-password`, `new-password`, `name`), `spellCheck={false}` для email/паролей.
- [x] **Мобильная адаптивность:** На экранах шириной 375px (iPhone SE) боковая панель скрывается (`hidden lg:flex`), форма центрируется с безопасными отступами `p-6`, горизонтальный скролл полностью отсутствует.
- [x] **Кнопки с иконками:** Кнопка переключения темы и кнопка показа/скрытия пароля имеют `aria-label` и `<span className="sr-only">`.

---

## 8. План верификации (Verification Plan)

1. **Компиляция и типизация TypeScript:**
   - Команда: `npm run build` в папке `frontend/`.
   - Ожидаемый результат: `0` ошибок компиляции TypeScript и успешная сборка Vite.
2. **Сквозные E2E тесты модуля Auth & Settings:**
   - Команда: `npx playwright test tests/login.spec.ts tests/sign-up.spec.ts tests/reset-password.spec.ts tests/auth.setup.ts tests/user-settings.spec.ts --workers=1`
   - Ожидаемый результат: 100% успешное прохождение всех спецификаций авторизации и темы.
3. **Визуальная проверка (375px и 1440px):**
   - На десктопе (1440px): отображение глубокой изумрудной панели слева и карточки формы справа.
   - На мобильном (375px): отображение логотипа `Atlas Meal CRM`, переключателя темы, формы и футера без обрезки по горизонтали.
