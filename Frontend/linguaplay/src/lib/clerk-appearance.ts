import { shadcn, dark } from "@clerk/themes";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function getClerkAppearance(theme: "light" | "dark") {
  const isDark = theme === "dark";
  return {
    baseTheme: isDark ? dark : undefined,
    theme: shadcn,
    cssLayerName: "clerk",
    options: {
      logoPlacement: "inside" as const,
      logoLinkUrl: basePath || "/",
      logoImageUrl:
        typeof window !== "undefined"
          ? `${window.location.origin}${basePath}/logo.svg`
          : `${basePath}/logo.svg`,
    },
    variables: {
      colorPrimary: "hsl(142.1 70.6% 45.3%)",
      colorForeground: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
      colorMutedForeground: isDark
        ? "hsl(215 20.2% 65.1%)"
        : "hsl(215.4 16.3% 46.9%)",
      colorDanger: "hsl(0 84.2% 60.2%)",
      colorBackground: isDark ? "hsl(222.2 84% 4.9%)" : "hsl(0 0% 100%)",
      colorInput: isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(0 0% 100%)",
      colorInputForeground: isDark
        ? "hsl(210 40% 98%)"
        : "hsl(222.2 84% 4.9%)",
      colorNeutral: isDark
        ? "hsl(217.2 32.6% 17.5%)"
        : "hsl(214.3 31.8% 91.4%)",
      fontFamily: "'Nunito', sans-serif",
      borderRadius: "0.875rem",
    },
    elements: {
      rootBox: "w-full flex justify-center",
      cardBox:
        "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border-2 border-border shadow-xl",
      card: "!shadow-none !border-0 !bg-transparent !rounded-none",
      footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
      headerTitle: "text-2xl font-black text-foreground",
      headerSubtitle: "text-sm text-muted-foreground",
      socialButtonsBlockButton:
        "border-2 border-border bg-card hover:bg-muted text-foreground font-bold rounded-xl",
      socialButtonsBlockButtonText: "text-foreground font-bold",
      formFieldLabel: "text-sm font-bold text-foreground",
      formFieldInput:
        "border-2 border-border bg-input text-foreground rounded-xl px-4 py-2",
      formButtonPrimary:
        "bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase rounded-xl border-b-4 border-primary-border tracking-wide",
      footerAction: "text-sm",
      footerActionLink: "text-primary hover:text-primary/80 font-bold underline",
      footerActionText: "text-muted-foreground",
      dividerLine: "bg-border",
      dividerText: "text-xs uppercase text-muted-foreground font-bold",
      identityPreviewEditButton: "text-primary font-bold",
      formFieldSuccessText: "text-success font-bold",
      alertText: "text-foreground",
      alert: "border-2 border-destructive/40 bg-destructive/10 rounded-xl",
      logoBox: "mb-2 flex justify-center",
      logoImage: "h-12 w-auto",
      main: "gap-4",
      otpCodeFieldInput:
        "border-2 border-border bg-input text-foreground rounded-xl",
      formFieldRow: "gap-2",
    },
  };
}

export const clerkLocalization = {
  socialButtonsBlockButton: "{{provider|titleize}}-р үргэлжлүүлэх",
  dividerText: "эсвэл",
  formFieldLabel__emailAddress: "И-мэйл хаяг",
  formFieldLabel__password: "Нууц үг",
  formFieldLabel__username: "Хэрэглэгчийн нэр",
  formFieldLabel__firstName: "Нэр",
  formFieldLabel__lastName: "Овог",
  formFieldLabel__confirmPassword: "Нууц үг баталгаажуулах",
  formFieldInputPlaceholder__emailAddress: "тан@жишээ.mn",
  formFieldInputPlaceholder__password: "Нууц үгээ оруулна уу",
  formButtonPrimary: "Үргэлжлүүлэх",
  signIn: {
    start: {
      title: "LinguaPlay-д тавтай морил",
      subtitle: "Үргэлжлүүлэхийн тулд нэвтэрнэ үү",
      actionText: "Бүртгэлгүй юу?",
      actionLink: "Бүртгүүлэх",
    },
    password: {
      title: "Нууц үгээ оруулна уу",
      subtitle: "Үргэлжлүүлэхийн тулд нууц үгээ оруулна уу",
      actionLink: "Өөр аргаар нэвтрэх",
    },
    forgotPasswordAlternativeMethods: {
      title: "Нууц үгээ мартсан уу?",
      label__alternativeMethods: "Эсвэл өөр аргаар нэвтэрнэ үү",
      blockButton__resetPassword: "Нууц үгээ сэргээх",
    },
    forgotPassword: {
      title_email: "И-мэйлээ шалгана уу",
      title_phone: "Утсаа шалгана уу",
      subtitle_email: "{{identifier}} хаягт явуулсан кодыг оруулна уу",
      formTitle: "Нууц үг сэргээх код",
      formSubtitle: "И-мэйлд явуулсан кодыг оруулна уу",
      resendButton: "Дахин илгээх",
    },
  },
  signUp: {
    start: {
      title: "Шинэ бүртгэл үүсгэх",
      subtitle: "LinguaPlay-р шинэ хэл сурахаа эхлүүлээрэй",
      actionText: "Аль хэдийн бүртгэлтэй юу?",
      actionLink: "Нэвтрэх",
    },
    emailCode: {
      title: "И-мэйлээ баталгаажуулна уу",
      subtitle: "Үргэлжлүүлэхийн тулд и-мэйлээ баталгаажуулна уу",
      formTitle: "Баталгаажуулах код",
      formSubtitle: "{{identifier}} хаягт явуулсан кодыг оруулна уу",
      resendButton: "Дахин илгээх",
    },
  },
  userButton: {
    action__signOut: "Гарах",
    action__manageAccount: "Бүртгэл удирдах",
  },
  formFieldError__notMatchingPasswords: "Нууц үг таарахгүй байна",
  unstable__errors: {
    form_password_pwned:
      "Энэ нууц үг хууртагдсан тул аюулгүй биш байна. Өөр нууц үг сонгоно уу.",
    form_password_validation_failed: "Нууц үг хүчингүй байна",
    form_password_length_too_short:
      "Нууц үг наад зах нь 8 тэмдэгттэй байх ёстой",
  },
};
