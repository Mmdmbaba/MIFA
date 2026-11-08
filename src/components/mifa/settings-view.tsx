"use client"

// تنظیمات MIFA — تم، پشتیبان‌گیری و درباره
import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { RibbonMark } from "./mifa-logo"
import { OnboardingWizard } from "./onboarding"
import { useImportData, useClearAll } from "./mifa-hooks"
import { Download, Upload, Sun, Moon, Info, ShieldCheck, NotebookPen } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const importData = useImportData()
  const clearAll = useClearAll()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmImport, setConfirmImport] = useState<Record<string, unknown> | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const exportJson = async () => {
    try {
      const res = await fetch("/api/data")
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `mifa-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: "پشتیبان دانلود شد ✓", description: "فایل رو جایی امن نگه دار" })
    } catch {
      toast({ title: "خطا در تهیه پشتیبان", variant: "destructive" })
    }
  }

  const onFile = async (file: File) => {
    try {
      const json = JSON.parse(await file.text())
      if (json?.app !== "MIFA") {
        toast({ title: "این فایل پشتیبان MIFA نیست", variant: "destructive" })
        return
      }
      setConfirmImport(json)
    } catch {
      toast({ title: "فایل JSON معتبر نیست", variant: "destructive" })
    }
  }

  const doImport = () => {
    if (!confirmImport) return
    importData.mutate(confirmImport as never, {
      onSuccess: (r) => {
        toast({ title: "داده بازگردانی شد ✓", description: "تمام داده‌های قبلی جایگزین شد" })
        setConfirmImport(null)
      },
      onError: (e) => toast({ title: e.message, variant: "destructive" }),
      onSettled: () => setConfirmImport(null),
    })
  }

  return (
    <div className="space-y-4 mifa-fade-up">
      {/* برنامه */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="mifa-h4">برنامه ماهانه</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setEditOpen(true)}
            className="w-full h-11 justify-start gap-2.5">
            <NotebookPen className="w-4 h-4 text-primary" />
            ویرایش درآمد، خرج ثابت، پس‌انداز و شروع دوره
          </Button>
        </CardContent>
      </Card>

      {/* ظاهر */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="mifa-h4">ظاهر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="w-4 h-4 text-[#08D9D6]" /> : <Sun className="w-4 h-4 text-[#08D9D6]" />}
              <Label className="text-body-sm">حالت تیره</Label>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
              aria-label="تغییر حالت تیره"
            />
          </div>
        </CardContent>
      </Card>

      {/* داده‌ها */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="mifa-h4">داده‌ها و پشتیبان</CardTitle>
          <p className="text-caption text-muted-foreground flex items-start gap-1.5 mt-1">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#08D9D6] mt-px" />
            داده‌ها فقط برای خودت ذخیره می‌شن — هر وقت خواستی ببرشون جایی امن
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={exportJson}
            className="w-full h-11 justify-start gap-2.5">
            <Download className="w-4 h-4 text-[#08D9D6]" />
            دانلود پشتیبان (JSON)
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}
            className="w-full h-11 justify-start gap-2.5" disabled={importData.isPending}>
            <Upload className="w-4 h-4 text-[#08D9D6]" />
            بازگردانی از پشتیبان
          </Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} aria-label="فایل پشتیبان" />
          <Button variant="outline" onClick={() => setConfirmClear(true)}
            className="w-full h-11 justify-start gap-2.5 text-destructive hover:text-destructive">
            پاک‌سازی همه داده‌ها
          </Button>
        </CardContent>
      </Card>

      {/* درباره */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="mifa-h4 inline-flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" /> درباره MIFA
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <RibbonMark size={56} className="shrink-0" />
          <div>
            <p className="font-extrabold tracking-[0.15em] text-lg">MIFA</p>
            <p className="text-body-sm text-muted-foreground mt-1">پولت رو بشناس، بیشتر نگه دار.</p>
            <p className="text-caption text-muted-foreground mt-1.5">نسخه ۲.۰ · ساخته‌شده برای مدیریت مالی شخصی</p>
          </div>
        </CardContent>
      </Card>

      {/* ویرایش برنامه — بدون پاک شدن داده‌ها، با مقادیر فعلی */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[94vh] overflow-y-auto">
          <DialogTitle className="sr-only">ویرایش برنامه</DialogTitle>
          <OnboardingWizard editMode onDone={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* تایید پاک‌سازی */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>پاک‌سازی همه داده‌ها؟</AlertDialogTitle>
            <AlertDialogDescription>
              همه تراکنش‌ها و بودجه‌ها برای همیشه حذف می‌شن و قابل بازگشت نیستن.
              اگه پشتیبان نگرفتی، اول از «دانلود پشتیبان» استفاده کن.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>بی‌خیال</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              clearAll.mutate(undefined, {
                onSuccess: () => toast({ title: "همه داده‌ها پاک شد" }),
                onError: (e) => toast({ title: e.message, variant: "destructive" }),
                onSettled: () => setConfirmClear(false),
              })
            }} className="bg-destructive text-white hover:bg-destructive/90">
              پاک کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* تایید بازگردانی */}
      <AlertDialog open={!!confirmImport} onOpenChange={(v) => !v && setConfirmImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>بازگردانی پشتیبان؟</AlertDialogTitle>
            <AlertDialogDescription>
              همه داده‌های فعلی با محتوای فایل پشتیبان جایگزین می‌شن. ادامه بدم؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={doImport}>بله، بازگردانی کن</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
